// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ALMANAC_TEXT, CLOCK_TEXT, LUCIA_TEXT, PIECE_TEXT, SYSTEMS_TEXT, TERMINAL_TEXT, TERMS, WINDOW_TEXT, toPlainText, type TermId } from '@/copy';
import { startSession } from '@/game';
import { INCIDENTS } from '@/levels';
import type { Progress } from '@/storage';
import { filterIncident } from '@/testing/incidents';
import { IncidentPage } from '@/ui/incident-page';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const mapSize = vi.hoisted(() => ({ width: 1060, height: 800 }));

vi.mock('@mantine/hooks', async (importOriginal) => {
  const original = await importOriginal<typeof import('@mantine/hooks')>();
  return { ...original, useElementSize: () => ({ ...original.useElementSize(), ...mapSize }) };
});

const TOP_STRIP = '.incident__strip';
const LUCIA_ZONE = '.incident__lucia';
const BAR = '.incident__systems';
const INCIDENT_WITH_A_CLOCK = '02-12';
const INCIDENT_WITHOUT_A_CLOCK = '01-01';
const FIVE_MINUTES = 'Esperar 5 min';
const ONE_MINUTE = 'Esperar 1 min';
const TIME_AT_START = '0 min 00 s';
const TIME_AFTER_FIVE_MINUTES = '5 min 00 s';
const FIRST = filterIncident('04-01').id;
const SECOND = filterIncident('04-02').id;
const PLAYED = '01-04';
const LATER = '01-05';
const REGISTRY_BUTTON = /^Historial \(\d+\)$/;
const COURSE_ORDER_PROGRESS: Progress = { '01-05': 3, '01-04': 2, '01-02': 1, '01-01': 3 };
const LESSONS_OF_THE_COURSE = ['01-01', '01-02', '01-04'];
const WITH_AND_WITHOUT_STARS: Progress = { '01-01': 3, '01-02': 0, '01-03': 2, '01-04': 0, '01-05': 3 };
const LESSONS_WITH_STARS = ['01-01', '01-03'];

type User = ReturnType<typeof userEvent.setup>;

function elementOf(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing on the page matches ${selector}`);
  return found;
}

const takeawayOf = (incidentId: string) => toPlainText(INCIDENTS.find(({ id }) => id === incidentId)?.takeaway ?? '');
const renderIncident = (incidentId: string, progress?: Progress) => render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={vi.fn()} progress={progress} />);
const theClock = () => within(elementOf(TOP_STRIP)).queryByRole('region', { name: CLOCK_TEXT.title });
const almanacButton = () => within(elementOf(TOP_STRIP)).getByRole('button', { name: ALMANAC_TEXT.open });
const registryButton = () => within(elementOf(BAR)).getByRole('button', { name: REGISTRY_BUTTON });
const theAlmanac = () => screen.getByRole('dialog', { name: ALMANAC_TEXT.open });
const theRegistry = () => screen.getByRole('dialog', { name: SYSTEMS_TEXT.registry });
const tabNamed = (name: string) => within(theAlmanac()).getByRole('tab', { name });
const lessonsShown = () => within(theAlmanac()).queryAllByRole('listitem').map((item) => item.textContent);

async function send(user: User) {
  await user.click(within(elementOf(BAR)).getByRole('button', { name: PIECE_TEXT.tabs.terminal }));
  await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
}

async function openTheAlmanac(user: User) {
  await user.click(almanacButton());
  return theAlmanac();
}

async function openTheLessons(user: User) {
  await openTheAlmanac(user);
  await user.click(tabNamed(ALMANAC_TEXT.lessons));
}

function termNames(window: HTMLElement): (string | null | undefined)[] {
  return [...window.querySelectorAll('dt')].map((dt) => dt.querySelector('.glossary__name')?.textContent);
}

function termRow(window: HTMLElement, name: string): HTMLElement {
  const row = [...window.querySelectorAll('dt')].find((dt) => dt.querySelector('.glossary__name')?.textContent === name);
  if (!(row instanceof HTMLElement)) throw new Error(`missing glossary row ${name}`);
  return row;
}

const namesOf = (ids: readonly TermId[]) => ids.map((id) => TERMS[id].name).sort((a, b) => a.localeCompare(b, 'es'));

describe('the clock of the game in the top strip', () => {
  it('the clock is a region of the top strip named Reloj del juego, only in an incident that has one and while it is open', async () => {
    const user = userEvent.setup();
    const view = renderIncident(INCIDENT_WITHOUT_A_CLOCK);
    expect(screen.queryByRole('region', { name: CLOCK_TEXT.title }), 'an incident with no clock draws none').toBeNull();
    view.unmount();

    renderIncident(INCIDENT_WITH_A_CLOCK);
    const clock = theClock();
    expect(clock, 'the clock is in the top strip').not.toBeNull();
    if (clock === null) return;
    expect(within(clock).getByText(TIME_AT_START)).toBeInTheDocument();
    expect(within(clock).getByRole('button', { name: ONE_MINUTE })).toBeInTheDocument();
    expect(within(clock).getByRole('button', { name: FIVE_MINUTES })).toBeInTheDocument();
    expect(within(elementOf(LUCIA_ZONE)).queryByRole('region', { name: CLOCK_TEXT.title }), 'and not in the zone of Lucía').toBeNull();

    await send(user);
    await user.click(within(clock).getByRole('button', { name: FIVE_MINUTES }));
    expect(within(clock).getByText(TIME_AFTER_FIVE_MINUTES)).toBeInTheDocument();
    await send(user);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(theClock(), 'once the incident is over the clock goes').toBeNull();
  });
});

describe('the Almanaque in a system window', () => {
  it('the Almanaque button of the strip opens a window with the tabs Términos and Lecciones and the same button closes it', async () => {
    const user = userEvent.setup();
    renderIncident(FIRST);
    const button = almanacButton();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const tabs = within(theAlmanac()).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([ALMANAC_TEXT.terms, ALMANAC_TEXT.lessons]);
    expect(within(theAlmanac()).getByRole('tablist', { name: ALMANAC_TEXT.tabs })).toBeInTheDocument();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(button);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('Esc and the X close the Almanaque and give the focus back to its button', async () => {
    const user = userEvent.setup();
    renderIncident(FIRST);
    const button = almanacButton();
    await user.click(button);
    expect(theAlmanac()).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(button).toHaveFocus());
    await user.click(button);
    await user.click(within(theAlmanac()).getByRole('button', { name: WINDOW_TEXT.closeLabel }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(button).toHaveFocus());
  });

  it("Historial and the Almanaque change in one click, each from the other's open window", async () => {
    const user = userEvent.setup();
    renderIncident(INCIDENT_WITH_A_CLOCK);
    await send(user);
    await user.click(registryButton());
    expect(theRegistry()).toBeInTheDocument();
    await user.click(almanacButton());
    expect(screen.queryByRole('dialog', { name: SYSTEMS_TEXT.registry })).toBeNull();
    expect(theAlmanac()).toBeInTheDocument();
    expect(registryButton()).toHaveAttribute('aria-expanded', 'false');
    await user.click(registryButton());
    expect(screen.queryByRole('dialog', { name: ALMANAC_TEXT.open })).toBeNull();
    expect(theRegistry()).toBeInTheDocument();
    expect(almanacButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('the Almanaque opens on its last tab again until the incident is left', async () => {
    const user = userEvent.setup();
    const view = renderIncident(FIRST);
    await openTheAlmanac(user);
    expect(tabNamed(ALMANAC_TEXT.terms)).toHaveAttribute('aria-selected', 'true');
    await user.click(tabNamed(ALMANAC_TEXT.lessons));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await openTheAlmanac(user);
    expect(tabNamed(ALMANAC_TEXT.lessons)).toHaveAttribute('aria-selected', 'true');
    view.unmount();
    renderIncident(FIRST);
    await openTheAlmanac(user);
    expect(tabNamed(ALMANAC_TEXT.terms)).toHaveAttribute('aria-selected', 'true');
  });

  it('Lecciones lists the takeaway of each incident the player solved with one star or more, up to the one being played, in the order of the course', async () => {
    const user = userEvent.setup();
    renderIncident(PLAYED, COURSE_ORDER_PROGRESS);
    await openTheLessons(user);
    const items = within(theAlmanac()).getAllByRole('listitem');
    expect(items).toHaveLength(LESSONS_OF_THE_COURSE.length);
    LESSONS_OF_THE_COURSE.forEach((id, at) => expect(items[at], id).toHaveTextContent(takeawayOf(id)));
  });

  it('Lecciones leaves out the incidents that come later and those with no star, and with none says so', async () => {
    const user = userEvent.setup();
    const view = renderIncident(PLAYED, WITH_AND_WITHOUT_STARS);
    await openTheLessons(user);
    const shown = lessonsShown().join(' ');
    LESSONS_WITH_STARS.forEach((id) => expect(shown, id).toContain(takeawayOf(id)));
    for (const id of ['01-02', PLAYED, LATER]) expect(shown, `${id} is left out`).not.toContain(takeawayOf(id));
    expect(lessonsShown()).toHaveLength(LESSONS_WITH_STARS.length);
    expect(screen.queryByText(ALMANAC_TEXT.noLessons)).toBeNull();
    view.unmount();

    renderIncident(PLAYED);
    await openTheLessons(user);
    expect(within(theAlmanac()).getByText(ALMANAC_TEXT.noLessons)).toBeInTheDocument();
    expect(lessonsShown()).toEqual([]);
  });

  it('the lessons of the open window follow the progress that IncidentPage gives when the player finishes the incident', async () => {
    const user = userEvent.setup();
    const page = (progress: Progress) => <IncidentPage incidents={INCIDENTS} levelId={PLAYED} progress={progress} onFinish={vi.fn()} />;
    const started: Progress = { '01-03': 1 };
    const view = render(page(started));
    await openTheLessons(user);
    expect(within(theAlmanac()).getAllByRole('listitem')).toHaveLength(1);
    view.rerender(page({ ...started, [PLAYED]: 3 }));
    const items = within(theAlmanac()).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent(takeawayOf(PLAYED));
  });
});

describe('Términos of the Almanaque', () => {
  it('Términos keeps the definitions in one list', async () => {
    const user = userEvent.setup();
    const { container } = renderIncident(FIRST);
    await openTheAlmanac(user);
    expect(container.querySelectorAll('dl')).toHaveLength(1);
    expect(within(theAlmanac()).getByText(TERMS['security-group'].definition)).toBeInTheDocument();
  });

  it('lists the new terms first, marked new, and then every earlier term, each group in alphabetical order', async () => {
    const user = userEvent.setup();
    renderIncident(SECOND);
    const window = await openTheAlmanac(user);
    const second = filterIncident(SECOND);
    const earlier = [...startSession(INCIDENTS, second.id).known].filter((id) => !second.introduces.includes(id));
    expect(termNames(window)).toEqual([...namesOf(second.introduces), ...namesOf(earlier)]);
    const marked = [...window.querySelectorAll('dt')].filter((dt) => within(dt).queryByText(LUCIA_TEXT.newBadge));
    expect(marked.map((dt) => dt.querySelector('.glossary__name')?.textContent)).toEqual(namesOf(second.introduces));
  });

  it('shows the icon of the entity a term names, and none for a term with no entity', async () => {
    const user = userEvent.setup();
    renderIncident(SECOND);
    const window = await openTheAlmanac(user);
    expect(termRow(window, TERMS['security-group'].name).querySelector('svg.entity-icon')).toBeInTheDocument();
    expect(termRow(window, TERMS['echo-reply'].name).querySelector('svg.entity-icon')).toBeInTheDocument();
    expect(termRow(window, TERMS['least-privilege'].name).querySelector('svg')).toBeNull();
  });

  it('the glossary of 04-01 keeps the terms of chapter 1, least-privilege among them, and has none from a later incident', async () => {
    const user = userEvent.setup();
    renderIncident(FIRST);
    const names = termNames(await openTheAlmanac(user));
    expect(names).toContain(TERMS['ip-address'].name);
    expect(names).toContain(TERMS['least-privilege'].name);
    expect(names).not.toContain(TERMS.stateful.name);
    expect(names).not.toContain(TERMS['outbound-rule'].name);
  });
});
