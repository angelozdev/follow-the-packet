// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASE_TEXT, CLOCK_TEXT, EXPLANATION_TEXT, INSPECTION_TEXT, LUCIA_TEXT, OUTCOME_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, TERMS, toPlainText } from '@/copy';
import { inspect, pieceViews, registryLines, startSession } from '@/game';
import { INCIDENTS, knownTerms, type CaseSpec, type DiagnoseIncident, type Incident, type SendIncident } from '@/levels';
import { pieceDomId, type GameSceneProps } from '@/scene';
import { layoutMap } from '@/scene/layout/map-layout';
import { GLYPH_BOX } from '@/scene/marks/still-packets';
import { OFFICE, OFFICE_FLOORS, device, ping } from '@/testing/fixtures';
import { CHAPTER_1_TERMS, NOTE_RULE, diagnoseIncident, filterIncident, gatewayIncident, identifyIncident, namesSendIncident, repairableDiagnoseIncident, sendIncident } from '@/testing/incidents';
import { IncidentScreen } from './incident-screen';

const scene = vi.hoisted(() => ({ drawsTheList: false, drawsTheRealMap: false, sheet: { width: 1060, height: 800 } }));

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/hooks')>()),
  useElementSize: () => ({ ref: () => undefined, ...scene.sheet }),
}));

vi.mock('@/scene/game-scene', async () => {
  const { GameScene: TheRealMap } = await vi.importActual<typeof import('@/scene/game-scene')>('@/scene/game-scene');
  const { PieceLabel } = await vi.importActual<typeof import('@/scene/overlay/piece-label')>('@/scene/overlay/piece-label');
  const { toPlainText } = await vi.importActual<typeof import('@/copy')>('@/copy');
  const PlainScene = ({ pieces, flows, sent, inspectTrigger, inspectStampsTrigger, onActivate, known }: GameSceneProps) => (
    <div data-known={[...(known ?? [])].sort().join(' ')}>
      {pieces.map((piece) => (
        <PieceLabel key={piece.id} piece={piece} trigger={inspectTrigger(piece.id)} onActivate={onActivate} />
      ))}
      {[...flows, ...sent].map((flow) => (
        <button key={flow.id} type="button" {...inspectTrigger(flow.pieceId)}>
          {toPlainText(flow.label)}
        </button>
      ))}
      {scene.drawsTheList && (
        <button type="button" {...inspectStampsTrigger([...flows, ...sent].map(({ id }) => id))}>
          {LIST_OF_THE_STAMPS}
        </button>
      )}
    </div>
  );
  return { GameScene: (props: GameSceneProps) => (scene.drawsTheRealMap ? <TheRealMap {...props} /> : <PlainScene {...props} />) };
});

const LIST_OF_THE_STAMPS = 'los sellos de este lugar';
const NOTE_FEEDBACK = 'No es IPv4: cada uno de los cuatro números va de 0 a 255.';
const SG_SERVIDOR2 = 'Security Group servidor2';
const OTHER_DOOR = 'Security Group servidor1';
const LOCKED_SERVER = 'servidor2 con candado';
const ATTACKER_PACKET = 'ping de Atacante a servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const LOCKED_PIECE = 'device:servidor2';
const COLUMN = '.incident__side';
const HOLDER_OF_THE_PREVIEW = '.incident__inspection';
const ANYWHERE = 'Anywhere-IPv4 (0.0.0.0/0)';
const FULL_STARS = 3;
const FIRST = filterIncident('04-01');
const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;
const QUESTION = toPlainText(EXPLANATION_TEXT.asks(EXPLANATION_TEXT.whatHappened));
const BEFORE_THE_GRACE_ENDS_MS = 100;
const AFTER_THE_GRACE_ENDS_MS = 1000;
const TAB_STOPS_LIMIT = 80;
const TAP = '[TouchA]';
const CLOCK = CLOCK_TEXT.title;
const DIG_ANSWER = TERMINAL_TEXT.output.label.dig;
const FIVE_MINUTES = 'Esperar 5 min';

type User = ReturnType<typeof userEvent.setup>;

afterEach(() => {
  vi.useRealTimers();
  scene.drawsTheList = false;
});

function renderWithFakeTimers() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  renderFirst();
  return user;
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function theColumn(): HTMLElement {
  const column = document.querySelector<HTMLElement>(COLUMN);
  if (column === null) throw new Error('the column is not on the page');
  return column;
}

function expectInThePanel(region: HTMLElement) {
  expect(region.parentElement).toBe(theColumn());
  expect(region.closest(HOLDER_OF_THE_PREVIEW)).toBeNull();
}

function panelOfTheColumn(): HTMLElement {
  const panel = theColumn().querySelector<HTMLElement>(':scope > section');
  if (panel === null) throw new Error('the panel is not in the column');
  return panel;
}

function theBar(): HTMLElement {
  return screen.getByRole('log');
}

function pieceLabel(name: string): HTMLElement {
  const label = screen.getAllByRole('button', { name }).find((button) => button.classList.contains('map-button'));
  if (label === undefined) throw new Error(`no piece on the map is called ${name}`);
  return label;
}

async function showTab(user: User, panel: HTMLElement, name: string) {
  const tab = within(panel).getByRole('tab', { name });
  if (tab.getAttribute('aria-selected') !== 'true') await user.click(tab);
  return panel;
}

async function chooseTheStampWithTheKeyboard(user: User) {
  const stamp = screen.getByRole('button', { name: ATTACKER_PACKET });
  await tabTo(user, stamp);
  await user.keyboard('{Enter}');
  return stamp;
}

async function tabTo(user: User, element: HTMLElement) {
  for (let stops = 0; stops < TAB_STOPS_LIMIT && document.activeElement !== element; stops++) await user.tab();
  expect(element).toHaveFocus();
}

function firstScreen(onFinish = vi.fn()) {
  return <IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId="04-02" onFinish={onFinish} />;
}

function renderFirst() {
  const onFinish = vi.fn();
  render(firstScreen(onFinish));
  return onFinish;
}

async function placeRule(user: User, source: string) {
  await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
  const card = screen.getByRole('region', { name: SG_SERVIDOR2 });
  await user.click(within(card).getByRole('button', { name: ECHO_REQUEST }));
  await user.click(within(card).getByRole('button', { name: source }));
  return card;
}

function tracingIncident(): SendIncident {
  const gateway = gatewayIncident();
  return { ...gateway, send: { ...gateway.send, message: [...gateway.send.message, { id: 'trace', label: '{{traceroute}}', command: 'traceroute', icmpType: 8 }] } };
}

async function sendTraceToAndres(user: User) {
  await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
  const terminal = await showTab(user, screen.getByRole('region', { name: 'tu-laptop' }), 'Terminal');
  await user.click(within(terminal).getByRole('button', { name: '192.168.2.15' }));
  await user.click(within(terminal).getByRole('button', { name: 'traceroute' }));
  await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
}

describe('incident screen', () => {
  it('explains the stamps and the lock with the inspect help in the panel, and gives the panel to a piece once the player chooses it', async () => {
    const user = userEvent.setup();
    renderFirst();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    expect(screen.getByText(SCREEN_TEXT.stampLegend)).toBeInTheDocument();
    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.getByText(SCREEN_TEXT.stampLegend), 'a hover leaves the panel as it is').toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByText(SCREEN_TEXT.stampLegend)).toBeNull();
  });

  it('gives the map the terms the player knows at this incident', () => {
    const { container } = render(firstScreen());
    expect(container.querySelector('[data-known]')?.getAttribute('data-known')).toBe([...knownTerms(INCIDENTS, FIRST.id)].sort().join(' '));
  });

  it('the stamp legend names every stamp state, the warning included', () => {
    renderFirst();
    const legend = screen.getByText(SCREEN_TEXT.stampLegend);
    for (const entry of ['✓ llegó', '✕ lo frenaron', '? se perdió', '! apareció un aviso']) expect(legend).toHaveTextContent(entry);
  });

  it('opens the card from its Security Group, and Esc closes it and gives the focus back to it', async () => {
    const user = userEvent.setup();
    renderFirst();
    const label = screen.getByRole('button', { name: SG_SERVIDOR2 });
    await user.click(label);
    const panel = screen.getByRole('region', { name: SG_SERVIDOR2 });
    expect(within(panel).getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
    within(panel).getByRole('button', { name: ECHO_REQUEST }).focus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 }), 'Escape leaves the panel where it is').toBe(panel);
    expect(label).toHaveFocus();
  });

  it('a rule placed from the card shows up in it', async () => {
    const user = userEvent.setup();
    renderFirst();
    const card = await placeRule(user, SG_SERVIDOR1);
    expect(within(card).getByRole('button', { name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} ← ${SG_SERVIDOR1}`) })).toBeInTheDocument();
  });

  it('switching to another Security Group opens its card with an empty slot', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    await user.click(within(screen.getByRole('region', { name: SG_SERVIDOR2 })).getByRole('button', { name: ECHO_REQUEST }));
    await user.click(screen.getByRole('button', { name: OTHER_DOOR }));
    const card = screen.getByRole('region', { name: OTHER_DOOR });
    expect(within(card).queryByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) })).toBeNull();
    expect(within(card).getByRole('button', { name: ECHO_REQUEST, pressed: false })).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: OTHER_DOOR })).toBeInTheDocument();
  });

  it('a locked piece can be inspected but opens no card', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
  });

  it('the inspection box starts with what the piece is and leaves out fields whose term comes later', async () => {
    const user = userEvent.setup();
    render(<IncidentScreen incidents={INCIDENTS.filter(({ chapter }) => chapter !== 2)} incidentId={FIRST.id} nextId="04-02" onFinish={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    const box = screen.getByRole('region', { name: 'servidor2' });
    expect(within(box).getByRole('heading', { name: 'servidor2' }).querySelector('svg.entity-icon')).toBeInTheDocument();
    expect(box.querySelector('dt')).toHaveTextContent('Qué es');
    expect(box.querySelector('dd')).toHaveTextContent(TERMS['ec2-instance'].definition);
    expect(box).toHaveTextContent('IP privada');
    expect(box).toHaveTextContent('172.31.38.97');
    expect(box).toHaveTextContent('IP pública');
    expect(box).toHaveTextContent('34.244.254.100');
    expect(box).not.toHaveTextContent('Nombres DNS');
  });

  it('a packet says where and why it stopped, and the box shows no hover definitions', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expect(box).toHaveTextContent('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
    expect(box.querySelector('.term')).toBeInTheDocument();
    expect(box.querySelector('.term--tip')).toBeNull();
  });

  it('sending with Anywhere-IPv4 open gets Lucía’s reply and the incident goes on, until a rule changes', async () => {
    const user = userEvent.setup();
    renderFirst();
    const card = await placeRule(user, ANYWHERE);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('status')).toHaveTextContent(LUCIA_TEXT.intruding);
    expect(screen.queryByRole('heading', { name: QUESTION })).toBeNull();
    expect(within(card).getByRole('heading', { name: SG_SERVIDOR2 })).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} ← ${ANYWHERE}`) }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('sending with every task done and the card open closes the card, moves the focus to Lucía’s question, and the right answer gives 3 stars', async () => {
    const user = userEvent.setup();
    const onFinish = renderFirst();
    await placeRule(user, SG_SERVIDOR1);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(within(screen.getByRole('region', { name: SG_SERVIDOR2 })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Estado']);
    expect(screen.getByRole('heading', { name: QUESTION })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RIGHT_ANSWER }));
    expect(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult }));
    expect(onFinish).toHaveBeenCalledWith(FULL_STARS);
    expect(screen.getByText(ROADMAP_TEXT.starsOf(FULL_STARS))).toBeInTheDocument();
  });

  it('the feedback of a wrong option of the question of Lucía is an error message', async () => {
    const user = userEvent.setup();
    renderFirst();
    await placeRule(user, SG_SERVIDOR1);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    const wrong = FIRST.explanation.find((option) => !option.correct);
    if (!wrong) throw new Error('the question has no wrong option');
    await user.click(screen.getByRole('button', { name: toPlainText(wrong.text) }));
    const feedback = screen.getByText(EXPLANATION_TEXT.wrong).closest('p');
    expect(feedback).toHaveClass('message message--error', { exact: true });
    expect(feedback?.querySelector('.message__tab')).toHaveTextContent('✕ Error');
    expect(feedback).toHaveTextContent(toPlainText(wrong.feedback));
  });
});

describe('the inspection box can be reached with the mouse', () => {
  it('lingers for a moment after the pointer leaves the piece, so the pointer can cross to it, and then goes', async () => {
    const user = renderWithFakeTimers();
    const piece = screen.getByRole('button', { name: LOCKED_SERVER });
    await user.hover(piece);
    await user.unhover(piece);
    wait(BEFORE_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
  });

  it('stays while the pointer is over it, however long, and goes as soon as the pointer leaves it', async () => {
    const user = renderWithFakeTimers();
    const piece = screen.getByRole('button', { name: LOCKED_SERVER });
    await user.hover(piece);
    await user.unhover(piece);
    const box = screen.getByRole('region', { name: 'servidor2' });
    await user.hover(box);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
    await user.unhover(box);
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
  });

  it('gives way at once to the next piece the pointer reaches', async () => {
    const user = renderWithFakeTimers();
    const first = screen.getByRole('button', { name: LOCKED_SERVER });
    await user.hover(first);
    await user.unhover(first);
    await user.hover(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toBeInTheDocument();
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toBeInTheDocument();
  });
});

describe('a piece or a stamp can be chosen and read in the panel', () => {
  it('clicking a piece shows what it is in the panel of the column', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    const panel = screen.getByRole('region', { name: 'servidor2' });
    expectInThePanel(panel);
    expect(within(panel).getByRole('heading', { name: 'servidor2' }).querySelector('svg.entity-icon')).toBeInTheDocument();
    expect(panel.querySelector('dt')).toHaveTextContent(INSPECTION_TEXT.whatIs);
    expect(within(panel).queryByRole('button', { name: INSPECTION_TEXT.closeLabel }), 'a piece stays chosen until another is').toBeNull();
  });

  it('clicking a stamp, a packet or a «+N» shows its box in the panel with «Cerrar»', async () => {
    scene.drawsTheList = true;
    const user = userEvent.setup();
    renderFirst();
    const { runs, sent } = startSession(INCIDENTS, FIRST.id);
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    const packet = screen.getByRole('region', { name: ATTACKER_PACKET });
    expectInThePanel(packet);
    expect(within(packet).getByRole('button', { name: INSPECTION_TEXT.closeLabel })).toHaveTextContent(INSPECTION_TEXT.close);
    await user.click(screen.getByRole('button', { name: LIST_OF_THE_STAMPS }));
    const list = screen.getByRole('region', { name: INSPECTION_TEXT.stampsTitle(runs.length + sent.length) });
    expectInThePanel(list);
    expect(within(list).getByRole('button', { name: INSPECTION_TEXT.closeLabel })).toHaveTextContent(INSPECTION_TEXT.close);
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET }), 'the list takes the place of the packet').toBeNull();
  });

  it('with touch, a tap on a stamp shows its box in the panel, which a tap outside leaves where it is', async () => {
    const user = renderWithFakeTimers();
    await user.pointer({ keys: TAP, target: screen.getByRole('button', { name: ATTACKER_PACKET }) });
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expectInThePanel(box);
    wait(AFTER_THE_GRACE_ENDS_MS);
    await user.pointer({ keys: TAP, target: screen.getByRole('heading', { level: 1 }) });
    expect(screen.getByRole('region', { name: ATTACKER_PACKET })).toBe(box);
  });

  it('a hover or a focus still previews the box on the map and selects nothing', async () => {
    const user = userEvent.setup();
    renderFirst();
    const piece = screen.getByRole('button', { name: LOCKED_SERVER });
    await user.hover(piece);
    const preview = screen.getByRole('region', { name: 'servidor2' });
    expect(preview.closest(HOLDER_OF_THE_PREVIEW)).not.toBeNull();
    expect(within(preview).queryByRole('button', { name: INSPECTION_TEXT.closeLabel })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp), 'the panel is still the help').toBeInTheDocument();
    await user.unhover(piece);
    await user.click(screen.getByRole('heading', { level: 1 }));
    await tabTo(user, piece);
    expect(screen.getByRole('region', { name: 'servidor2' }).closest(HOLDER_OF_THE_PREVIEW)).not.toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp), 'a focus selects nothing either').toBeInTheDocument();
  });

  it('hovering another piece previews it and leaves the one that was chosen in the panel', async () => {
    const user = renderWithFakeTimers();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    const piece = screen.getByRole('button', { name: LOCKED_SERVER });
    await user.hover(piece);
    await user.unhover(piece);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: ATTACKER_PACKET }).parentElement).toBe(theColumn());
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
  });

  it('with nothing selected the panel is the inspect help and the legend of the stamps', () => {
    renderFirst();
    const note = screen.getByText(SCREEN_TEXT.inspectHelp).closest('.message--note');
    expect(note?.parentElement, 'the note is the panel, a direct child of the column').toBe(theColumn());
    expect(note?.previousElementSibling, 'right under the region of Lucía').toBe(theColumn().firstElementChild);
    expect(within(note as HTMLElement).getByText(SCREEN_TEXT.inspectClickHelp)).toBeInTheDocument();
    expect(within(note as HTMLElement).getByText(SCREEN_TEXT.stampLegend)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
  });

  it('Enter or Space on a piece selects it and moves the focus to the heading of its panel, and Escape gives the focus back to the piece', async () => {
    for (const key of ['{Enter}', ' ']) {
      const user = userEvent.setup();
      const view = render(firstScreen());
      const piece = screen.getByRole('button', { name: LOCKED_SERVER });
      await tabTo(user, piece);
      await user.keyboard(key);
      const panel = screen.getByRole('region', { name: 'servidor2' });
      expectInThePanel(panel);
      expect(within(panel).getByRole('heading', { name: 'servidor2' }), key).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(piece, key).toHaveFocus();
      expect(screen.getByRole('region', { name: 'servidor2' }), 'Escape keeps the piece chosen').toBe(panel);
      view.unmount();
    }
  });

  it('Enter on a stamp shows its box in the panel and puts the focus on its heading; Escape gives the focus back to the stamp', async () => {
    const user = userEvent.setup();
    renderFirst();
    const stamp = await chooseTheStampWithTheKeyboard(user);
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expectInThePanel(box);
    expect(within(box).getByRole('heading', { name: ATTACKER_PACKET })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(stamp).toHaveFocus();
    expect(screen.getByRole('region', { name: ATTACKER_PACKET })).toBe(box);
  });

  it('Shift+Tab from the heading of a packet in the panel reaches «Cerrar», and Enter on it releases the choice and gives the focus back to the stamp', async () => {
    const user = renderWithFakeTimers();
    const stamp = await chooseTheStampWithTheKeyboard(user);
    await user.tab({ shift: true });
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expectInThePanel(box);
    expect(within(box).getByRole('button', { name: INSPECTION_TEXT.closeLabel })).toHaveFocus();
    await user.keyboard('{Enter}');
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
    expect(stamp).toHaveFocus();
  });

  it("clicking a piece that opens a card opens it, keeps the focus in it and shows the piece in the panel", async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    expectInThePanel(screen.getByRole('region', { name: SG_SERVIDOR2 }));
    expect(within(panelOfTheColumn()).getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Enter on a piece that opens a card keeps the focus in the card and shows the piece in the panel', async () => {
    const user = userEvent.setup();
    renderFirst();
    await tabTo(user, screen.getByRole('button', { name: SG_SERVIDOR2 }));
    await user.keyboard('{Enter}');
    const panel = screen.getByRole('region', { name: SG_SERVIDOR2 });
    expectInThePanel(panel);
    expect(within(panel).getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
  });

  it('a piece chosen with the keyboard that opens a card does not take the focus when the phase changes', async () => {
    const user = userEvent.setup();
    renderFirst();
    await tabTo(user, screen.getByRole('button', { name: SG_SERVIDOR2 }));
    await user.keyboard('{Enter}');
    const card = screen.getByRole('region', { name: SG_SERVIDOR2 });
    await tabTo(user, within(card).getByRole('button', { name: ECHO_REQUEST }));
    await user.keyboard('{Enter}');
    await tabTo(user, within(card).getByRole('button', { name: SG_SERVIDOR1 }));
    await user.keyboard('{Enter}');
    await tabTo(user, screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    await user.keyboard('{Enter}');
    expectInThePanel(screen.getByRole('region', { name: SG_SERVIDOR2 }));
    expect(screen.getByRole('heading', { name: QUESTION })).toHaveFocus();
  });

  it('Escape inside a card closes the card, leaves the focus on the piece and keeps the piece in the panel', async () => {
    const user = userEvent.setup();
    renderFirst();
    const label = screen.getByRole('button', { name: SG_SERVIDOR2 });
    await user.click(label);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expectInThePanel(screen.getByRole('region', { name: SG_SERVIDOR2 }));
    expect(label).toHaveFocus();
  });

  it('«Cerrar» releases the choice, the help comes back and the focus goes to the stamp', async () => {
    const user = userEvent.setup();
    renderFirst();
    const stamp = screen.getByRole('button', { name: ATTACKER_PACKET });
    await user.click(stamp);
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expectInThePanel(box);
    await user.click(within(box).getByRole('button', { name: INSPECTION_TEXT.closeLabel }));
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    expect(stamp).not.toHaveAttribute('data-pinned');
    expect(stamp).toHaveFocus();
  });

  it('a click on another piece chooses that one in place of the first', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
    expectInThePanel(screen.getByRole('region', { name: 'servidor2' }));
  });

  it('the panel is a region named by its heading and is no dialog', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    const panel = screen.getByRole('region', { name: SG_SERVIDOR2 });
    const heading = within(panel).getByRole('heading', { name: SG_SERVIDOR2 });
    expectInThePanel(panel);
    expect(panel).toHaveAttribute('aria-labelledby', heading.id);
    expect(panel).not.toHaveAttribute('role');
    expect(panel.closest('[role="dialog"]')).toBeNull();
    expect(screen.queryAllByRole('dialog'), 'no dialog is drawn').toHaveLength(0);
  });

});

describe('the ring of the chosen piece', () => {
  beforeEach(() => {
    scene.drawsTheRealMap = true;
  });

  afterEach(() => {
    scene.drawsTheRealMap = false;
  });

  it('the selected piece wears the ring the piece with an open card wore', async () => {
    const user = userEvent.setup();
    renderFirst();
    const ring = () => document.querySelector(`[data-piece="${LOCKED_PIECE}"] .map-piece__mat`);
    expect(ring()).toBeNull();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(ring(), 'a piece with no card is selected too').not.toBeNull();
    await user.click(screen.getByRole('button', { name: /^Atacante/ }));
    expect(ring(), 'the ring goes with the choice').toBeNull();
  });
});

describe('a chosen piece or packet that the map no longer draws', () => {
  const DIAGNOSE = diagnoseIncident();
  const LOOPBACK_PING = 'ping de tu-laptop a 127.0.0.1';
  const rightCause = toPlainText(DIAGNOSE.diagnose.cases[0].cause.options.find((option) => option.correct)?.text ?? '');

  it('the selection is released when its piece or its packet is no longer drawn', async () => {
    const user = userEvent.setup();
    render(<IncidentScreen incidents={[DIAGNOSE]} incidentId={DIAGNOSE.id} nextId={null} onFinish={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    const terminal = screen.getByRole('region', { name: 'tu-laptop' });
    await user.click(within(terminal).getByRole('button', { name: '127.0.0.1' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
    await user.click(screen.getByRole('button', { name: LOOPBACK_PING }));
    expectInThePanel(screen.getByRole('region', { name: LOOPBACK_PING }));

    await user.click(screen.getByRole('button', { name: CASE_TEXT.know }));
    await user.click(screen.getByRole('button', { name: rightCause }));
    expectInThePanel(screen.getByRole('region', { name: LOOPBACK_PING }));
    await user.click(screen.getByRole('button', { name: CASE_TEXT.next }));

    expect(screen.queryByRole('button', { name: LOOPBACK_PING })).toBeNull();
    expect(screen.queryByRole('region', { name: LOOPBACK_PING })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    await user.hover(screen.getByRole('button', { name: 'tu-laptop' }));
    expect(screen.getByRole('region', { name: 'tu-laptop' })).not.toHaveTextContent(INSPECTION_TEXT.close);
  });
});

describe('every piece of every registered incident can be read in the panel', () => {
  it('every piece the map draws in every registered incident shows its fields in the panel', async () => {
    const user = userEvent.setup({ delay: null });
    const shown: string[] = [];
    for (const { id } of INCIDENTS) {
      const session = startSession(INCIDENTS, id);
      const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={id} nextId={null} onFinish={vi.fn()} />);
      for (const { id: pieceId } of pieceViews(session)) {
        const inspection = inspect(session, pieceId);
        const label = document.getElementById(pieceDomId(pieceId));
        if (inspection === null || label === null) {
          shown.push(`${id} ${pieceId}: nothing to read`);
          continue;
        }
        await user.click(label);
        const panel = screen.getByRole('region', { name: toPlainText(inspection.title) });
        await user.click(within(panel).getByRole('tab', { name: 'Estado' }));
        if (panel.parentElement !== theColumn() || panel.querySelectorAll('dt').length !== inspection.fields.length) shown.push(`${id} ${pieceId}: the panel does not show its fields`);
      }
      view.unmount();
    }
    expect(shown).toEqual([]);
  });
});

describe('the panel of a piece in the column of the screen', () => {
  beforeEach(() => {
    scene.drawsTheRealMap = true;
  });

  afterEach(() => {
    scene.drawsTheRealMap = false;
  });

  it('Tab goes from the map to the column', async () => {
    const user = userEvent.setup();
    renderFirst();
    const labels = [...document.querySelectorAll<HTMLElement>('.incident__map button')];
    const last = labels.at(-1) as HTMLElement;
    last.focus();
    expect(last).toHaveFocus();
    await user.tab();
    expect(document.activeElement?.closest('.incident__side'), 'the next stop after the last control of the map is in the column').not.toBeNull();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    const [first] = within(panelOfTheColumn()).getAllByRole('tab');
    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement?.closest('.incident__map'), 'Shift+Tab from the panel goes back to the map or to Lucía, never past the column').toBeNull();
  });

  it('Escape in the panel gives the focus back to the piece', async () => {
    const user = userEvent.setup();
    renderFirst();
    const label = pieceLabel(SG_SERVIDOR2);
    await tabTo(user, label);
    await user.keyboard('{Enter}');
    const panel = panelOfTheColumn();
    expect(within(panel).getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    await tabTo(user, within(panel).getByRole('tab', { name: 'Tablas' }));
    await user.keyboard('{Escape}');
    expect(label, 'Escape from a tab of the panel').toHaveFocus();
    expect(panelOfTheColumn(), 'the piece stays chosen').toBe(panel);
    await user.click(within(panel).getByRole('button', { name: ECHO_REQUEST }));
    await user.keyboard('{Escape}');
    expect(label, 'Escape from a chip of the panel').toHaveFocus();
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toBe(panel);
  });

  it('no card opens beside a piece in any registered incident', { timeout: 120_000 }, async () => {
    const user = userEvent.setup({ delay: null });
    const opened: string[] = [];
    const clickEveryPiece = async (incidentId: string) => {
      const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={vi.fn()} />);
      const labels = pieceViews(startSession(INCIDENTS, incidentId)).flatMap((piece) => document.getElementById(pieceDomId(piece.id)) ?? []);
      for (const label of labels) {
        await user.click(label);
        if (document.querySelector('.map-card, [role="dialog"]') !== null) opened.push(`${incidentId} ${label.id}`);
        expect(panelOfTheColumn().parentElement, `${incidentId} ${label.id}: the panel is in the column`).toBe(theColumn());
      }
      view.unmount();
    };
    for (const { id } of INCIDENTS) await clickEveryPiece(id);
    expect(opened).toEqual([]);
  });
});

describe('incident screen of a send incident', () => {
  const SENDING = sendIncident();

  function renderSending() {
    render(<IncidentScreen incidents={[SENDING]} incidentId={SENDING.id} nextId={null} onFinish={vi.fn()} />);
  }

  const terminal = panelOfTheColumn;

  async function send(user: User, address: string, message: string) {
    await user.click(within(terminal()).getByRole('button', { name: address }));
    await user.click(within(terminal()).getByRole('button', { name: message }));
    await user.click(within(terminal()).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  it('shows the same legend, which names no term the player has not met', () => {
    renderSending();
    expect(screen.getByText(SCREEN_TEXT.stampLegend)).toBeInTheDocument();
    expect(SCREEN_TEXT.stampLegend).not.toMatch(/firewall|security group|paquete|ping|icmp|red\b|regla/i);
  });

  it('your laptop opens its terminal, and a packet sent from it shows up and can be inspected', async () => {
    const user = userEvent.setup();
    renderSending();
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    expect(within(screen.getByRole('region', { name: 'your-laptop' })).getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
    await send(user, '192.168.1.20', 'ping');
    await user.click(screen.getByRole('button', { name: 'ping de your-laptop a printer' }));
    expect(screen.getByRole('region', { name: 'ping de your-laptop a printer' })).toHaveTextContent('Llegó y volvió la respuesta.');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(LUCIA_TEXT.done);
  });

  it('gives the map what turns the packets of a place into the box of the list of their stamps, which the «+N» of the 2D map hovers', async () => {
    scene.drawsTheList = true;
    const user = userEvent.setup();
    renderSending();
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    await send(user, '192.168.1.20', 'ping');
    await user.hover(screen.getByRole('button', { name: LIST_OF_THE_STAMPS }));
    const list = screen.getByRole('region', { name: INSPECTION_TEXT.stampsTitle(1) });
    expect(list).toHaveTextContent('ping de your-laptop a printer');
    expect(list).toHaveTextContent(INSPECTION_TEXT.stampLine('arrived'));
  });

  it('picking another origin moves the terminal beside it, and Esc gives the focus back to the piece it stands beside', async () => {
    const user = userEvent.setup();
    renderSending();
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    await user.click(within(terminal()).getByRole('button', { name: 'Atacante' }));
    expect(terminal()).toHaveAccessibleName('Atacante');
    expect(within(terminal()).getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: 'Atacante' }), 'Escape leaves the panel where it is').toBeInTheDocument();
    expect(pieceLabel('Atacante')).toHaveFocus();
  });

  it('with every send task done, Lucía asks the incident’s own question', async () => {
    const user = userEvent.setup();
    renderSending();
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    await send(user, '192.168.1.20', 'ping');
    await user.click(within(terminal()).getByRole('button', { name: 'Atacante' }));
    await send(user, '192.168.1.11', 'ping');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('heading', { name: 'Lucía: «¿Por qué volvió el ping?»' })).toHaveFocus();
  });
});

describe('incident screen of a send incident with settings', () => {
  const GATEWAY = { ...gatewayIncident(), introduces: [...CHAPTER_1_TERMS] };
  const SETTINGS_TAB = 'Ajustes';
  const ROUTER = '192.168.1.1';
  const LOST_PING = 'ping de tu-laptop a 192.168.2.15';
  const PING_ANDRES = 'ping de tu-laptop a laptop-andres';

  const TRACING = tracingIncident();

  function renderGateway() {
    render(<IncidentScreen incidents={[GATEWAY]} incidentId={GATEWAY.id} nextId={null} onFinish={vi.fn()} />);
  }

  async function sendToAndres(user: User) {
    const terminal = await showTab(user, screen.getByRole('region', { name: 'tu-laptop' }), 'Terminal');
    await user.click(within(terminal).getByRole('button', { name: '192.168.2.15' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  it('the laptop opens one card from its only button, with its terminal first and its settings in a tab, and the terminal offers no setting', async () => {
    const user = userEvent.setup();
    renderGateway();
    expect(screen.getAllByRole('button', { name: /^tu-laptop/ })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    const terminal = screen.getByRole('region', { name: 'tu-laptop' });
    expect(within(terminal).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Estado', SETTINGS_TAB, 'Terminal']);
    expect(within(terminal).getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
    expect(within(terminal).queryByRole('group', { name: TERMS['default-gateway'].name })).toBeNull();
    expect(within(terminal).queryByRole('button', { name: ROUTER })).toBeNull();
    await user.click(within(terminal).getByRole('tab', { name: SETTINGS_TAB }));
    expect(within(terminal).queryByRole('button', { name: TERMINAL_TEXT.send })).toBeNull();
    expect(within(terminal).getByRole('group', { name: TERMS['default-gateway'].name })).toBeInTheDocument();
    expect(within(terminal).getByRole('heading', { name: 'Ajustes de red' })).toBeInTheDocument();
  });

  it('setting the gateway on the tab makes the ping come back and clears the stamps of before, and Esc gives the focus back to the only button of the label', async () => {
    const user = userEvent.setup();
    renderGateway();
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await sendToAndres(user);
    expect(screen.getByRole('button', { name: LOST_PING })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: SETTINGS_TAB }));
    await user.click(within(screen.getByRole('region', { name: 'tu-laptop' })).getByRole('button', { name: ROUTER }));
    expect(screen.queryByRole('button', { name: LOST_PING })).toBeNull();
    expect(screen.getByRole('button', { name: ROUTER })).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: 'tu-laptop' }), 'Escape leaves the panel where it is').toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tu-laptop' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await sendToAndres(user);
    await user.click(screen.getByRole('button', { name: PING_ANDRES }));
    expect(screen.getByRole('region', { name: PING_ANDRES })).toHaveTextContent('Llegó y volvió la respuesta.');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(LUCIA_TEXT.done);
  });

  it('a traceroute the sender cannot send shows its reason as a warning message', async () => {
    const user = userEvent.setup();
    render(<IncidentScreen incidents={[TRACING]} incidentId={TRACING.id} nextId={null} onFinish={vi.fn()} />);
    await sendTraceToAndres(user);
    const reason = within(screen.getByRole('region', { name: 'tu-laptop' })).getByText(OUTCOME_TEXT['no-route']);
    expect(reason.tagName).toBe('P');
    expect(reason).toHaveClass('message message--warning', { exact: true });
    expect(reason.querySelector('.message__tab')).toHaveTextContent('! Aviso');
    expect(reason).not.toHaveAttribute('role');
  });
});

describe('incident screen of an identify incident', () => {
  const IDENTIFYING = identifyIncident();
  const PRINTER_CARD = 'impresora';
  const GUEST_CARD = 'laptop-visita';
  const [GUEST_TASK, PRINTER_TASK] = IDENTIFYING.tasks.map((task) => toPlainText(task.text));

  function renderIdentifying() {
    render(<IncidentScreen incidents={[IDENTIFYING]} incidentId={IDENTIFYING.id} nextId={null} onFinish={vi.fn()} />);
  }

  const taskItem = (text: string) => screen.getByText(text).closest('li');

  it('opens the card of a device from its piece, and the pieces without a card open nothing', async () => {
    const user = userEvent.setup();
    renderIdentifying();
    await user.click(screen.getByRole('button', { name: 'tu-laptop con candado' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(screen.getByRole('region', { name: 'tu-laptop' })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Estado']);
    await user.click(screen.getByRole('button', { name: PRINTER_CARD }));
    expect(screen.getByRole('region', { name: PRINTER_CARD })).toHaveTextContent('¿Cuál es su dirección IP?');
  });

  it('a pick does not tick the task until Listo, and Escape gives the focus back to the piece', async () => {
    const user = userEvent.setup();
    renderIdentifying();
    await user.click(screen.getByRole('button', { name: PRINTER_CARD }));
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: '192.168.1.21' }));
    expect(taskItem(PRINTER_TASK)).toHaveTextContent(LUCIA_TEXT.pending);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: PRINTER_CARD }), 'Escape leaves the panel where it is').toBeInTheDocument();
    expect(screen.getByRole('button', { name: PRINTER_CARD })).toHaveFocus();
    expect(taskItem(PRINTER_TASK)).toHaveTextContent(LUCIA_TEXT.pending);
  });

  it('Listo with the right IP ticks the task and shows the line with the rule of the note, and sending the solution then closes the incident', async () => {
    const user = userEvent.setup();
    renderIdentifying();
    await user.click(screen.getByRole('button', { name: GUEST_CARD }));
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: 'No' }));
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(screen.queryByRole('region', { name: GUEST_CARD })).toBeNull();
    expect(taskItem(GUEST_TASK)).toHaveTextContent(LUCIA_TEXT.done);

    await user.click(screen.getByRole('button', { name: PRINTER_CARD }));
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: '192.168.1.21' }));
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(screen.getByRole('region', { name: PRINTER_CARD })).toHaveTextContent(`Correcto. ${NOTE_RULE}`);
    expect(taskItem(PRINTER_TASK)).toHaveTextContent(LUCIA_TEXT.done);

    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(within(panelOfTheColumn()).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Estado']);
    expect(screen.getByRole('heading', { name: 'Lucía: «¿Por qué 192.168.1.300 no puede ser la IP de la impresora?»' })).toHaveFocus();
  });

  it('sending the solution with the IP of the note still picked leaves the incident open', async () => {
    const user = userEvent.setup();
    renderIdentifying();
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByText(LUCIA_TEXT.failing(PRINTER_TASK))).toBeInTheDocument();
    expect(screen.getByText(LUCIA_TEXT.failing(GUEST_TASK))).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Lucía: «/ })).toBeNull();
  });
});

describe('incident screen of a diagnose incident', () => {
  const DIAGNOSE = diagnoseIncident();
  const { cases } = DIAGNOSE.diagnose;
  const KNOW = CASE_TEXT.know;
  const NEXT = CASE_TEXT.next;
  const LOOPBACK_PING = 'ping de tu-laptop a 127.0.0.1';
  const optionOf = (number: number, right: boolean) => toPlainText(cases[number - 1].cause.options.find((option) => option.correct === right)?.text ?? '');

  function renderDiagnosing() {
    const onFinish = vi.fn();
    render(<IncidentScreen incidents={[DIAGNOSE]} incidentId={DIAGNOSE.id} nextId={null} onFinish={onFinish} />);
    return onFinish;
  }

  async function nameRight(user: User, number: number) {
    await user.click(screen.getByRole('button', { name: KNOW }));
    await user.click(screen.getByRole('button', { name: optionOf(number, true) }));
  }

  async function sendLoopback(user: User) {
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    const terminal = screen.getByRole('region', { name: 'tu-laptop' });
    await user.click(within(terminal).getByRole('button', { name: '127.0.0.1' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  it('shows the case card and Lucía with no tasks and no «Enviar solución», and the report of the incident', () => {
    renderDiagnosing();
    expect(screen.getByRole('region', { name: CASE_TEXT.title(1, cases.length) })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: LUCIA_TEXT.name })).toHaveTextContent('Hoy estás de guardia.');
    expect(screen.queryByRole('button', { name: LUCIA_TEXT.submit })).toBeNull();
    expect(screen.queryByText(LUCIA_TEXT.tasks)).toBeNull();
    expect(screen.queryByRole('heading', { name: EXPLANATION_TEXT.type })).toBeNull();
  });

  it('a test sent from the terminal of the origin ticks its line in the case card', async () => {
    const user = userEvent.setup();
    renderDiagnosing();
    await sendLoopback(user);
    expect(screen.getByRole('button', { name: LOOPBACK_PING })).toBeInTheDocument();
    const card = screen.getByRole('region', { name: CASE_TEXT.title(1, cases.length) });
    expect(within(card).getByText('ping 127.0.0.1').closest('li')).toHaveTextContent(`✓ ping 127.0.0.1 (${CASE_TEXT.sent})`);
  });

  it('the hints of Lucía are those of the case, and the next case brings its own and takes the tests of the case before away', async () => {
    const user = userEvent.setup();
    renderDiagnosing();
    await sendLoopback(user);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(toPlainText(cases[0].hints[0]))).toBeInTheDocument();
    await nameRight(user, 1);
    expect(screen.queryByRole('button', { name: LUCIA_TEXT.askHint })).toBeNull();
    await user.click(screen.getByRole('button', { name: NEXT }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: LOOPBACK_PING })).toBeNull();
    expect(screen.queryByText(toPlainText(cases[0].hints[0]))).toBeNull();
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(toPlainText(cases[1].hints[0]))).toBeInTheDocument();
    expect(screen.getByRole('region', { name: CASE_TEXT.title(2, cases.length) })).toBeInTheDocument();
  });

  it('naming every cause right with no hint gives 3 stars and the result says every case went right', async () => {
    const user = userEvent.setup();
    const onFinish = renderDiagnosing();
    for (const [index] of cases.entries()) {
      await nameRight(user, index + 1);
      await user.click(screen.getByRole('button', { name: index === cases.length - 1 ? EXPLANATION_TEXT.seeResult : NEXT }));
    }
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(FULL_STARS);
    expect(screen.getByText(ROADMAP_TEXT.starsOf(FULL_STARS))).toBeInTheDocument();
    expect(screen.getByText(RESULT_TEXT.cases.allFirstTry(cases.length))).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: CASE_TEXT.title(cases.length, cases.length) })).toBeNull();
  });

  it('a hint in the first case and a wrong cause in the last cost the middle and the explained stars, and the result names the case', async () => {
    const user = userEvent.setup();
    const onFinish = renderDiagnosing();
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    for (const [index] of cases.entries()) {
      const number = index + 1;
      if (number === cases.length) {
        await user.click(screen.getByRole('button', { name: KNOW }));
        await user.click(screen.getByRole('button', { name: optionOf(number, false) }));
        expect(screen.getByText(EXPLANATION_TEXT.wrong)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: optionOf(number, true) }));
      } else await nameRight(user, number);
      await user.click(screen.getByRole('button', { name: number === cases.length ? EXPLANATION_TEXT.seeResult : NEXT }));
    }
    expect(onFinish).toHaveBeenCalledWith(1);
    expect(screen.getByText(`No acertaste a la primera el caso ${cases.length}.`)).toBeInTheDocument();
  });
});

describe('incident screen of a diagnose incident with a case that has a fix', () => {
  const REPAIRABLE = repairableDiagnoseIncident();
  const { cases } = REPAIRABLE.diagnose;
  const fixed = cases.findIndex(({ fix }) => fix);
  const KNOW = CASE_TEXT.know;
  const NEXT = CASE_TEXT.next;
  const ROUTER_PANEL = 'router-provider';
  const optionOf = (index: number) => toPlainText(cases[index].cause.options.find((option) => option.correct)?.text ?? '');
  const caseCardOf = (index: number) => screen.getByRole('region', { name: CASE_TEXT.title(index + 1, cases.length) });
  const ticks = () => Array.from(caseCardOf(fixed).querySelectorAll('.tasks li'), (item) => item.textContent?.charAt(0));

  async function reachTheFix(user: User) {
    for (const index of cases.slice(0, fixed).keys()) {
      await user.click(screen.getByRole('button', { name: KNOW }));
      await user.click(screen.getByRole('button', { name: optionOf(index) }));
      await user.click(screen.getByRole('button', { name: NEXT }));
    }
  }

  async function repairTheRoutes(user: User) {
    await user.click(screen.getByRole('button', { name: 'router-provider' }));
    const table = screen.getByRole('region', { name: ROUTER_PANEL });
    await user.click(within(table).getByRole('button', { name: /^Quitar 0\.0\.0\.0\/0/ }));
    await user.click(within(table).getByRole('button', { name: '198.51.100.0/24' }));
    await user.click(within(table).getByRole('button', { name: 'router-backbone' }));
    await user.click(within(table).getByRole('button', { name: 'Agregar ruta' }));
    await user.keyboard('{Escape}');
  }

  async function renderAtTheFixAfterATest(user: User) {
    render(<IncidentScreen incidents={[REPAIRABLE]} incidentId={REPAIRABLE.id} nextId={null} onFinish={vi.fn()} />);
    await reachTheFix(user);
    await pingTheServer(user);
  }

  async function pingTheServer(user: User) {
    await user.click(screen.getByRole('button', { name: 'laptop-marta' }));
    const terminal = screen.getByRole('region', { name: 'laptop-marta' });
    expect(within(terminal).getByText('ping 198.51.100.50')).toBeInTheDocument();
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  it('closes the case with the cause and the routes of the provider edited from the card of its router, in any order', async () => {
    const user = userEvent.setup();
    render(<IncidentScreen incidents={[REPAIRABLE]} incidentId={REPAIRABLE.id} nextId={null} onFinish={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'router-provider' })).toBeNull();
    await reachTheFix(user);
    expect(screen.getByRole('button', { name: 'router-provider' })).toBeInTheDocument();
    await pingTheServer(user);
    expect(ticks()).toEqual(['✓', '☐']);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: KNOW }));
    await user.click(screen.getByRole('button', { name: optionOf(fixed) }));
    expect(screen.getByText(CASE_TEXT.causeNamed)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: NEXT })).toBeNull();
    await repairTheRoutes(user);
    expect(screen.queryByRole('button', { name: NEXT })).toBeNull();
    await pingTheServer(user);
    expect(ticks()).toEqual(['✓', '✓']);
    expect(screen.getByRole('button', { name: NEXT })).toBeInTheDocument();
    expect(screen.queryByText(CASE_TEXT.causeNamed)).toBeNull();
    await user.click(screen.getByRole('button', { name: NEXT }));
    expect(screen.queryByRole('button', { name: 'router-provider' })).toBeNull();
    expect(caseCardOf(fixed + 1)).toBeInTheDocument();
  });

  it('the case card says the sends start again, naming the router, when the routes of the fix change after a test, and until the next send', async () => {
    const user = userEvent.setup();
    await renderAtTheFixAfterATest(user);
    await user.keyboard('{Escape}');
    expect(theBar()).not.toHaveTextContent('Cambiaste');
    await repairTheRoutes(user);
    expect(theBar()).toHaveTextContent('Cambiaste la tabla de rutas de router-provider: las pruebas de antes eran con la red anterior. Vuelve a mandarlas.');
    expect(caseCardOf(fixed)).not.toHaveTextContent('Cambiaste');
    await pingTheServer(user);
    expect(theBar()).not.toHaveTextContent('Cambiaste');
  });

  it('the notice Cambiaste appears in the bar with the same words and in neither the card of Lucía nor the case card', async () => {
    const user = userEvent.setup();
    await renderAtTheFixAfterATest(user);
    await repairTheRoutes(user);
    const notice = theBar().querySelector('p.message');
    expect(notice).toHaveClass('message--note');
    expect(notice).toHaveTextContent('Cambiaste la tabla de rutas de router-provider: las pruebas de antes eran con la red anterior. Vuelve a mandarlas.');
    expect(screen.getByRole('region', { name: LUCIA_TEXT.name })).not.toHaveTextContent('Cambiaste');
    expect(caseCardOf(fixed)).not.toHaveTextContent('Cambiaste');
  });

  it('once the case is closed the card of the router keeps the table and offers nothing to edit', async () => {
    const user = userEvent.setup();
    render(<IncidentScreen incidents={[REPAIRABLE]} incidentId={REPAIRABLE.id} nextId={null} onFinish={vi.fn()} />);
    await reachTheFix(user);
    await repairTheRoutes(user);
    await pingTheServer(user);
    await user.click(screen.getByRole('button', { name: KNOW }));
    await user.click(screen.getByRole('button', { name: optionOf(fixed) }));
    expect(screen.getByRole('button', { name: NEXT })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'router-provider' }));
    const table = screen.getByRole('region', { name: ROUTER_PANEL });
    expect(within(table).getByRole('table')).toBeInTheDocument();
    expect(within(table).queryByRole('button', { name: /^Quitar/ })).toBeNull();
    expect(within(table).queryByRole('button', { name: 'Agregar ruta' })).toBeNull();
    expect(within(table).queryByRole('button', { name: '198.51.100.0/24' })).toBeNull();
    expect(within(table).queryByRole('status')).toBeNull();
  });
});

describe('the standard of warnings and errors', () => {
  const IDENTIFYING = identifyIncident();
  const DIAGNOSE = diagnoseIncident();
  const wrongCause = DIAGNOSE.diagnose.cases[0].cause.options.find((option) => !option.correct);
  const NOT_YET = toPlainText(LUCIA_TEXT.failing(FIRST.tasks[0].text));

  function paragraphsWith(text: string): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('p')).filter((paragraph) => paragraph.textContent?.includes(text));
  }

  function expectDrawnBy(text: string, variant: 'success' | 'warning' | 'error') {
    const paragraphs = paragraphsWith(text);
    expect(paragraphs, text).toHaveLength(1);
    expect(paragraphs[0], text).toHaveClass(`message message--${variant}`, { exact: true });
  }

  function expectNoAlertOutsideAMessage() {
    expect(screen.queryAllByRole('alert').filter((alert) => !alert.classList.contains('message'))).toEqual([]);
  }

  it('every warning and error an incident can trigger is drawn by Message and no alert is drawn outside it', async () => {
    const user = userEvent.setup();

    const firewall = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId={null} onFinish={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expectDrawnBy(NOT_YET, 'error');
    await placeRule(user, ANYWHERE);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expectDrawnBy(LUCIA_TEXT.intrusion, 'error');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expectDrawnBy(LUCIA_TEXT.intruding, 'error');
    expectNoAlertOutsideAMessage();
    firewall.unmount();

    const identify = render(<IncidentScreen incidents={[IDENTIFYING]} incidentId={IDENTIFYING.id} nextId={null} onFinish={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'impresora' }));
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: TASK_CARD_TEXT.done }));
    expectDrawnBy(NOTE_FEEDBACK, 'error');
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: '192.168.1.21' }));
    await user.click(within(panelOfTheColumn()).getByRole('button', { name: TASK_CARD_TEXT.done }));
    expectDrawnBy(NOTE_RULE, 'success');
    expectNoAlertOutsideAMessage();
    identify.unmount();

    const diagnose = render(<IncidentScreen incidents={[DIAGNOSE]} incidentId={DIAGNOSE.id} nextId={null} onFinish={vi.fn()} />);
    if (!wrongCause) throw new Error('the case has no wrong cause');
    await user.click(screen.getByRole('button', { name: CASE_TEXT.know }));
    await user.click(screen.getByRole('button', { name: toPlainText(wrongCause.text) }));
    expectDrawnBy(EXPLANATION_TEXT.wrong, 'error');
    expectNoAlertOutsideAMessage();
    diagnose.unmount();

    const tracing = tracingIncident();
    render(<IncidentScreen incidents={[tracing]} incidentId={tracing.id} nextId={null} onFinish={vi.fn()} />);
    await sendTraceToAndres(user);
    expectDrawnBy(OUTCOME_TEXT['no-route'], 'warning');
    expectNoAlertOutsideAMessage();
  });
});

describe('incident screen of a send incident with a clock, tables and services', () => {
  const NAMES = namesSendIncident();
  const WWW = 'www.lucia.example';
  const ONE_MINUTE = 'Esperar 1 min';
  const RESOLVER = 'servidor-dns';

  function renderNames(incident = NAMES) {
    render(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={vi.fn()} />);
  }

  const digTheName = (user: User) => sendByName(user, 'dig');

  async function sendByName(user: User, message: string) {
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    const terminal = screen.getByRole('region', { name: 'tu-laptop' });
    await user.click(within(terminal).getByRole('button', { name: WWW }));
    await user.click(within(terminal).getByRole('button', { name: message }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  const clock = () => within(screen.getByRole('region', { name: CLOCK })).getByText(/min \d\d s$/);

  it('a ping by name puts the question of the resolver on the map before the packet, each with its own box', async () => {
    const user = userEvent.setup();
    renderNames();
    await sendByName(user, 'ping');
    const question = screen.getByRole('button', { name: 'UDP 51514 → 53 de tu-laptop a servidor-dns' });
    const packet = screen.getByRole('button', { name: 'ping de tu-laptop a servidor-internet' });
    expect(question.compareDocumentPosition(packet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.hover(packet);
    await waitFor(() => expect(document.body.textContent).toContain('La consulta salió del puerto 51514 y se ve en el mapa, antes de este paquete.'));
    await user.hover(question);
    await waitFor(() => expect(document.body.textContent).toContain('Consulta y respuesta'));
    expect(document.body.textContent).not.toContain('La consulta salió del puerto');
  });

  it('the clock card shows only in an incident that has a clock', () => {
    renderNames();
    expect(screen.getByRole('region', { name: CLOCK })).toBeInTheDocument();
    expect(clock()).toHaveTextContent('0 min 00 s');
    cleanup();
    const sending = sendIncident();
    render(<IncidentScreen incidents={[sending]} incidentId={sending.id} nextId={null} onFinish={vi.fn()} />);
    expect(screen.queryByRole('region', { name: CLOCK })).toBeNull();
    cleanup();
    renderFirst();
    expect(screen.queryByRole('region', { name: CLOCK })).toBeNull();
  });

  it('the clock card sits below the card of Lucía', () => {
    renderNames();
    const lucia = screen.getByRole('region', { name: LUCIA_TEXT.name });
    const card = screen.getByRole('region', { name: CLOCK });
    expect(lucia.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lucia.parentElement).toBe(card.parentElement);
    expect(card.previousElementSibling).toBe(lucia);
  });

  it('waiting advances the game clock and the cache measures against it', async () => {
    const user = userEvent.setup();
    renderNames();
    await digTheName(user);
    await user.click(screen.getByRole('button', { name: RESOLVER }));
    const cache = screen.getByRole('region', { name: RESOLVER });
    expect(within(cache).getByRole('row', { name: new RegExp(WWW) })).toHaveTextContent('300 s');
    await user.click(screen.getByRole('button', { name: ONE_MINUTE }));
    expect(clock()).toHaveTextContent('1 min 00 s');
    expect(within(screen.getByRole('region', { name: RESOLVER })).getByRole('row', { name: new RegExp(WWW) })).toHaveTextContent('240 s');
    await user.click(screen.getByRole('button', { name: FIVE_MINUTES }));
    expect(clock()).toHaveTextContent('6 min 00 s');
    expect(within(screen.getByRole('region', { name: RESOLVER })).queryByRole('row', { name: new RegExp(WWW) })).toBeNull();
    expect(within(screen.getByRole('region', { name: RESOLVER })).getByText('No hay respuestas guardadas.')).toBeInTheDocument();
  });

  it('waiting keeps the sends and the last answer of the terminal', async () => {
    const user = userEvent.setup();
    renderNames();
    await digTheName(user);
    const sent = screen.getAllByRole('button', { name: /^UDP 51514 → 53 de tu-laptop a servidor-dns$/ });
    expect(sent.length).toBeGreaterThan(0);
    expect(screen.getByRole('group', { name: DIG_ANSWER })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: FIVE_MINUTES }));
    expect(screen.getByRole('group', { name: DIG_ANSWER })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^UDP 51514 → 53 de tu-laptop a servidor-dns$/ })).toHaveLength(sent.length);
  });

  it('the wait chips are reached and used with the keyboard', async () => {
    const user = userEvent.setup();
    renderNames();
    const minute = screen.getByRole('button', { name: ONE_MINUTE });
    minute.focus();
    expect(minute).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(clock()).toHaveTextContent('1 min 00 s');
    await user.tab();
    expect(screen.getByRole('button', { name: FIVE_MINUTES })).toHaveFocus();
    await user.keyboard(' ');
    expect(clock()).toHaveTextContent('6 min 00 s');
    expect(screen.getByRole('button', { name: ONE_MINUTE })).not.toHaveAttribute('aria-pressed');
  });

  it('opens the tabs of a router and a server of names from their only button', async () => {
    const user = userEvent.setup();
    renderNames();
    await user.click(screen.getByRole('button', { name: 'router-office' }));
    const tables = screen.getByRole('region', { name: 'router-office' });
    expect(within(tables).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Estado', 'Tablas', 'Tabla de rutas', 'Tabla de traducciones']);
    await user.click(within(tables).getByRole('tab', { name: 'Tabla de traducciones' }));
    expect(within(tables).getByRole('table', { name: 'Tabla de traducciones de router-office' })).toBeInTheDocument();
    within(tables).getByRole('tab', { name: 'Tabla de traducciones' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'router-office' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RESOLVER }));
    expect(within(screen.getByRole('region', { name: RESOLVER })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Estado', 'Tablas']);
    expect(screen.getByRole('table', { name: 'Caché de servidor-dns' })).toBeInTheDocument();
  });

  it('a refused entry of a table is drawn by Message in a region that was already there, with no alert outside a message', async () => {
    const user = userEvent.setup();
    renderNames();
    await user.click(screen.getByRole('button', { name: 'servidor-autoritativo' }));
    const card = screen.getByRole('region', { name: 'servidor-autoritativo' });
    const region = within(card).getByRole('status');
    expect(region).toBeEmptyDOMElement();
    await user.click(within(card).getByRole('button', { name: WWW }));
    await user.click(within(card).getByRole('button', { name: 'A' }));
    await user.click(within(card).getByRole('button', { name: '198.51.100.50' }));
    await user.click(within(card).getByRole('button', { name: 'Agregar registro' }));
    expect(within(card).getByRole('status')).toBe(region);
    const message = region.querySelector('p');
    expect(message).toHaveClass('message message--error', { exact: true });
    expect(message).toHaveTextContent('Ese registro ya está en la zona.');
    expect(screen.queryAllByRole('alert').filter((alert) => !alert.classList.contains('message'))).toEqual([]);
  });
});

describe('the incidents of the chapters on the 2D map', () => {
  const IP = { marta: '192.168.1.12', lucia: '192.168.1.11', andres: '192.168.2.15', router: '192.168.1.1', loopback: '127.0.0.1', server: '198.51.100.50', freshServer: '198.51.100.60' };
  const LUCIA = 'laptop-lucia';
  const SETTINGS_TAB = 'Ajustes';
  const PING = 'ping';
  const NC_TO_THE_APP = 'nc · puerto 3000';
  const NC_TO_THE_DATABASE = 'nc · puerto 5432';
  const NC_TO_THE_CLOSED_PORT = 'nc · puerto 3306';
  const NC_TO_THE_WEB_PORT = 'nc · puerto 80';
  const ANY_PACKET_STAMP = /^Paquete:/;
  const LOST_TO_MARTA = /^Paquete: ping de tu-laptop a laptop-marta\. Perdido\.$/;
  const BLOCKED_TO_MARTA = /^Paquete: ping de tu-laptop a laptop-marta\. Bloqueado\.$/;
  const LOST_TO_ANDRES = /^Paquete: ping de tu-laptop a 192\.168\.2\.15\. Perdido\.$/;
  const ARRIVED_AT_ANDRES = /^Paquete: ping de tu-laptop a laptop-andres\. Llegó\.$/;
  const STAMP_OF_THE_APP = /^Paquete: paquete al puerto 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
  const STAMP_OF_THE_DATABASE = /^Paquete: paquete al puerto 5432 de tu-laptop a laptop-lucia\. Llegó\.$/;
  const TAG_OF_THE_APP = 'paquete al puerto 3000';
  const TAG_OF_THE_DATABASE = 'paquete al puerto 5432';
  const STAMP_OF_THE_FIRST_CONNECTION = /^Paquete: TCP 51514 → 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
  const STAMP_OF_THE_SECOND_CONNECTION = /^Paquete: TCP 51515 → 5432 de tu-laptop a laptop-lucia\. Llegó\.$/;
  const TAG_OF_THE_FIRST_CONNECTION = 'TCP 51514 → 3000';
  const TAG_OF_THE_SECOND_CONNECTION = 'TCP 51515 → 5432';
  const STAMP_OF_THE_REFUSAL = /^Paquete: TCP 51514 → 3306 de tu-laptop a laptop-lucia\. Llegó\.$/;
  const STAMP_OF_THE_SILENCE = /^Paquete: TCP 51515 → 3000 de tu-laptop a laptop-marta\. Bloqueado\.$/;
  const STAMP_OF_THE_WRONG_ADDRESS = /^Paquete: TCP 51516 → 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
  const STAMP_OF_HER_OWN_APP = /^Paquete: TCP 51514 → 3000 de laptop-lucia a 127\.0\.0\.1\. Llegó\.$/;
  const TAGS_OF_THE_FOUR_TESTS = ['TCP 51514 → 3306', 'TCP 51515 → 3000', 'TCP 51516 → 3000', 'TCP 51514 → 3000'];
  const LABEL_BEFORE_THE_ROUTER = 'TCP 51514 → 80';
  const LABEL_AFTER_THE_ROUTER = 'TCP 40001 → 80';
  const ATTACKED_SERVER = 'servidor2 con candado con alerta: entra algo que no debe';
  const OFFICE_ROUTER_PIECE = 'router:office-router';
  const SAME_POINT = 1e-6;
  const SYSTEM_PREFERS_STILL = '(prefers-reduced-motion: reduce)';
  const NEXT_INCIDENT = 'Siguiente incidente';
  const OPENING_RULE_ANSWER = /solo hace falta permitir la ida/;
  const REPLY_RULE = /^Quitar la regla ICMP · Echo Reply/;
  const PING_TASK = 'vuelva a hacer';
  const DIG = 'dig';
  const ON_CALL = '02-14';
  const SHOP = 'tienda.lucia.example';
  const STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER = /^Paquete: UDP \d+ → 53 de tu-laptop a servidor-dns\./;
  const STAMP_OF_THE_PING_TO_THE_SHOP = /^Paquete: ping de tu-laptop a servidor-internet\./;
  const TAG_OF_THE_QUESTION = 'UDP 51514 → 53';
  const STAMP_OF_THE_PING_TO_THE_NEW_SERVER = /^Paquete: ping de tu-laptop a servidor-nuevo\. Llegó\.$/;
  const STAMP_OF_THE_REFUSED_NC = /^Paquete: TCP 51517 → 80 de tu-laptop a servidor-nuevo\. Llegó\.$/;
  const STAMP_OF_THE_NC_WITH_NO_PORT = /^Paquete: TCP 80 de tu-laptop a wwww\.lucia\.example\. Perdido\.$/;
  const STAMP_OF_THE_PING_TO_THE_STALE_SHOP = /^Paquete: ping de tu-laptop a tienda\.lucia\.example\. Apareció un aviso\.$/;
  const TAGS_OF_THE_NAME_TESTS = ['UDP 51514 → 53', 'UDP 51515 → 53', 'UDP 51516 → 53', 'TCP 51517 → 80'];
  const TAGS_OF_THE_TWO_QUESTIONS = ['UDP 51514 → 53', 'UDP 51515 → 53'];
  const ANSWER_FROM_THE_CACHE = /www\.lucia\.example\.\s*240\s*IN\s*A\s*198\.51\.100\.50/;
  const PROVIDER = 'router-proveedor';
  const REMOVE_THE_DEFAULT_ROUTE = /^Quitar 0\.0\.0\.0\/0/;
  const SERVERS_BLOCK = '198.51.100.0/24';
  const DESTINATION_HOP = '203.0.113.2 router-destino';
  const LOOP_CASE = 5;
  const TRACEROUTE = 'traceroute';
  const ADD_ROUTE = 'Agregar ruta';
  const STAMP_OF_THE_LOOPING_PING = 'Paquete: ping de tu-laptop a 198.51.100.50. Apareció un aviso.';
  const STAMP_OF_THE_LOOPING_TRACEROUTE = 'Paquete: traceroute de tu-laptop a 198.51.100.50. Apareció un aviso.';
  const STAMP_OF_THE_PING_THAT_COMES_BACK = 'Paquete: ping de tu-laptop a servidor-internet. Llegó.';
  const FIX_NOT_DONE = '☐ Que el ping a servidor-internet vuelva. (sin cumplir)';
  const FIX_DONE = '✓ Que el ping a servidor-internet vuelva. (cumplida)';
  const SERVICES_TAB = 'Ajustes';
  const ONLY_THIS_DEVICE = 'Solo este dispositivo (127.0.0.1)';
  const EVERY_IP = 'Todas las IPs (0.0.0.0)';
  const SENDS_START_AGAIN_ON_THE_APP = 'Cambiaste cómo escucha la app de laptop-lucia: las pruebas de antes eran con la red anterior. Vuelve a mandarlas.';

  beforeEach(() => {
    scene.drawsTheRealMap = true;
  });

  afterEach(() => {
    scene.drawsTheRealMap = false;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function renderIncident(id: string, nextId: string | null = null) {
    return render(<IncidentScreen incidents={INCIDENTS} incidentId={id} nextId={nextId} onFinish={vi.fn()} />);
  }

  async function openTheTerminal(user: User, laptop = 'tu-laptop') {
    await user.click(pieceLabel(laptop));
    return showTab(user, screen.getByRole('region', { name: laptop }), 'Terminal');
  }

  async function sendMessage(user: User, terminal: HTMLElement, message: string) {
    await user.click(within(terminal).getByRole('button', { name: message }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  async function sendTo(user: User, terminal: HTMLElement, ip: string) {
    await user.click(within(terminal).getByRole('button', { name: ip }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  async function sendNc(user: User, terminal: HTMLElement, ip: string, message: string) {
    await user.click(within(terminal).getByRole('button', { name: ip }));
    await sendMessage(user, terminal, message);
  }

  async function drawWithoutAnimations(user: User) {
    await user.click(screen.getByLabelText(SCREEN_TEXT.motion));
  }

  async function sendTheSolution(user: User) {
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
  }

  const packetTags = () => [...document.querySelectorAll('.packet-tag')].map(({ textContent }) => textContent);

  type Point = [number, number];

  function distanceBetween([x, y]: Point, [toX, toY]: Point): number {
    return Math.hypot(toX - x, toY - y);
  }

  function distanceAlong(path: Point[], point: Point): number {
    let walked = 0;
    for (const [index, to] of path.slice(1).entries()) {
      const from = path[index];
      const segment = distanceBetween(from, to);
      const detour = distanceBetween(from, point) + distanceBetween(point, to) - segment;
      if (Math.abs(detour) < SAME_POINT) return walked + distanceBetween(from, point);
      walked += segment;
    }
    throw new Error(`the point ${point} is not on the path`);
  }

  function pathOf(trace: Element): Point[] {
    const numbers = (trace.querySelector('.map-trace__line')?.getAttribute('d') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    return Array.from({ length: numbers.length / 2 }, (_, index): Point => [numbers[2 * index], numbers[2 * index + 1]]);
  }

  function goingShapeOf(trace: Element): Point {
    const icon = trace.querySelector('.map-packet[data-role="going"] > svg');
    const [x, y] = ['x', 'y'].map((name) => Number(icon?.getAttribute(name)));
    return [x + GLYPH_BOX / 2, y + GLYPH_BOX / 2];
  }

  function centerOfPiece(incidentId: string, pieceId: string): Point {
    const session = startSession(INCIDENTS, incidentId);
    const box = layoutMap(session.world, pieceViews(session), { width: scene.sheet.width }).icons[pieceId];
    return [box.x + box.width / 2, box.y + box.height / 2];
  }

  it('in 05 the stamp of the ping to laptop-marta tells a screen reader that it was lost, not blocked', async () => {
    const user = userEvent.setup();
    renderIncident('01-05');
    await sendTo(user, await openTheTerminal(user), IP.marta);
    expect(screen.getByRole('button', { name: LOST_TO_MARTA })).toBeVisible();
    expect(screen.queryAllByRole('button', { name: /^Paquete:.*Bloqueado/ })).toHaveLength(0);
  });

  it('in 11 the stamp of the ping to laptop-marta tells a screen reader that the firewall blocked it', async () => {
    const user = userEvent.setup();
    renderIncident('01-11');
    await sendTo(user, await openTheTerminal(user), IP.marta);
    expect(screen.getByRole('button', { name: BLOCKED_TO_MARTA })).toBeVisible();
    expect(screen.queryAllByRole('button', { name: /^Paquete:.*Perdido/ })).toHaveLength(0);
  });

  it('in 07 picking the gateway in the Ajustes de red tab changes the stamps of the ping', async () => {
    const user = userEvent.setup();
    renderIncident('01-07');
    await sendTo(user, await openTheTerminal(user), IP.andres);
    expect(screen.getByRole('button', { name: LOST_TO_ANDRES })).toBeVisible();
    await user.click(screen.getByRole('tab', { name: SETTINGS_TAB }));
    const settings = screen.getByRole('region', { name: 'tu-laptop' });
    await user.click(within(settings).getByRole('button', { name: IP.router }));
    expect(screen.queryAllByRole('button', { name: ANY_PACKET_STAMP })).toHaveLength(0);
    await sendTo(user, await openTheTerminal(user), IP.andres);
    expect(screen.getByRole('button', { name: ARRIVED_AT_ANDRES })).toBeVisible();
  });

  it('in 13 the tabs Entrada and Salida of the firewall card are reached and switched with the keyboard', async () => {
    const user = userEvent.setup();
    renderIncident('01-13');
    await user.click(screen.getByRole('button', { name: 'firewall tu-laptop' }));
    const firewall = screen.getByRole('region', { name: 'firewall tu-laptop' });
    const [inbound, outbound] = [/^entrada$/i, /^salida$/i].map((name) => within(firewall).getByRole('tab', { name }));
    inbound.focus();
    expect(inbound).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(outbound).toHaveFocus();
    expect(outbound).toHaveAttribute('aria-selected', 'true');
    expect(inbound).toHaveAttribute('aria-selected', 'false');
    expect(within(firewall).getByRole('tabpanel', { name: /^salida$/i })).toHaveTextContent('cerrada');
    await user.keyboard('{Home}');
    expect(inbound).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(outbound).toHaveAttribute('aria-selected', 'true');
  });

  it('in 02-01 the packet of an nc wears the port it goes to, and the ping wears no label', async () => {
    const user = userEvent.setup();
    renderIncident('02-01');
    await drawWithoutAnimations(user);
    const terminal = await openTheTerminal(user);
    await sendMessage(user, terminal, PING);
    await sendMessage(user, terminal, NC_TO_THE_APP);
    expect(screen.getByRole('button', { name: STAMP_OF_THE_APP })).toBeVisible();
    expect(packetTags()).toEqual([TAG_OF_THE_APP]);
    await sendMessage(user, await openTheTerminal(user), NC_TO_THE_DATABASE);
    expect(screen.getByRole('button', { name: STAMP_OF_THE_DATABASE })).toBeVisible();
    expect(packetTags()).toEqual([TAG_OF_THE_APP, TAG_OF_THE_DATABASE]);
  });

  it('in 02-02 the packet of an nc wears TCP and both ports, and the second connection leaves from the next port', async () => {
    const user = userEvent.setup();
    renderIncident('02-02');
    await drawWithoutAnimations(user);
    const first = await openTheTerminal(user);
    await sendMessage(user, first, NC_TO_THE_APP);
    expect(screen.getByRole('button', { name: STAMP_OF_THE_FIRST_CONNECTION })).toBeVisible();
    expect(packetTags()).toEqual([TAG_OF_THE_FIRST_CONNECTION]);
    await sendMessage(user, await openTheTerminal(user), NC_TO_THE_DATABASE);
    expect(screen.getByRole('button', { name: STAMP_OF_THE_SECOND_CONNECTION })).toBeVisible();
    expect(packetTags()).toEqual([TAG_OF_THE_FIRST_CONNECTION, TAG_OF_THE_SECOND_CONNECTION]);
  });

  it('in 02-03 a refusal leaves the stamp Llegó and a silence leaves Bloqueado, and the four tests wear TCP and both ports', async () => {
    const user = userEvent.setup();
    renderIncident('02-03');
    await drawWithoutAnimations(user);
    const yours = await openTheTerminal(user);
    await sendNc(user, yours, IP.lucia, NC_TO_THE_CLOSED_PORT);
    await sendNc(user, yours, IP.marta, NC_TO_THE_APP);
    await sendNc(user, yours, IP.lucia, NC_TO_THE_APP);
    const hers = await openTheTerminal(user, LUCIA);
    await sendNc(user, hers, IP.loopback, NC_TO_THE_APP);
    expect(screen.getByRole('button', { name: STAMP_OF_HER_OWN_APP })).toBeVisible();
    expect(screen.getByRole('button', { name: STAMP_OF_THE_REFUSAL })).toBeVisible();
    expect(screen.getByRole('button', { name: STAMP_OF_THE_SILENCE })).toBeVisible();
    expect(screen.getByRole('button', { name: STAMP_OF_THE_WRONG_ADDRESS })).toBeVisible();
    expect(packetTags()).toEqual(TAGS_OF_THE_FOUR_TESTS);
  });

  it('in 02-12 waiting from the clock card changes the answer of dig', async () => {
    const user = userEvent.setup();
    renderIncident('02-12');
    await drawWithoutAnimations(user);
    const terminal = await openTheTerminal(user);
    const send = () => user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
    const answerOfTheDig = () => screen.getByRole('group', { name: DIG_ANSWER }).textContent;
    await send();
    const old = answerOfTheDig();
    expect(old).toMatch(ANSWER_FROM_THE_CACHE);
    expect(old).not.toContain(IP.freshServer);
    await user.click(within(screen.getByRole('region', { name: CLOCK })).getByRole('button', { name: FIVE_MINUTES }));
    expect(answerOfTheDig(), 'waiting alone changes nothing the terminal printed').toBe(old);
    await send();
    const answered = answerOfTheDig();
    expect(answered).not.toBe(old);
    expect(answered).toContain(IP.freshServer);
    expect(answered).not.toContain(IP.server);
  });

  it('in 02-03 the services card opens from the label of laptop-lucia and switches the address', async () => {
    const user = userEvent.setup();
    renderIncident('02-03');
    await drawWithoutAnimations(user);
    const yours = await openTheTerminal(user);
    await sendNc(user, yours, IP.lucia, NC_TO_THE_APP);
    expect(screen.getByRole('button', { name: STAMP_OF_THE_FIRST_CONNECTION })).toBeVisible();
    await user.click(pieceLabel(LUCIA));
    await user.click(screen.getByRole('tab', { name: SERVICES_TAB }));
    const services = screen.getByRole('region', { name: LUCIA });
    const onlyHere = within(services).getByRole('button', { name: ONLY_THIS_DEVICE });
    const everywhere = within(services).getByRole('button', { name: EVERY_IP });
    expect([onlyHere, everywhere].map((chip) => chip.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    await user.click(everywhere);
    expect([onlyHere, everywhere].map((chip) => chip.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    expect(screen.queryAllByRole('button', { name: ANY_PACKET_STAMP }), 'a setting that changes the world clears the stamps').toHaveLength(0);
  });

  it('the tasks card says the sends start again, naming the device, when a change to the network clears them', async () => {
    const user = userEvent.setup();
    renderIncident('02-03');
    await drawWithoutAnimations(user);
    const lucia = screen.getByRole('region', { name: LUCIA_TEXT.name });
    const yours = await openTheTerminal(user);
    await sendNc(user, yours, IP.lucia, NC_TO_THE_CLOSED_PORT);
    await sendNc(user, yours, IP.marta, NC_TO_THE_APP);
    const hers = await openTheTerminal(user, LUCIA);
    await sendNc(user, hers, IP.loopback, NC_TO_THE_APP);
    expect(theBar()).not.toHaveTextContent(SENDS_START_AGAIN_ON_THE_APP);
    await user.click(pieceLabel(LUCIA));
    await user.click(screen.getByRole('tab', { name: SERVICES_TAB }));
    await user.click(within(screen.getByRole('region', { name: LUCIA })).getByRole('button', { name: EVERY_IP }));
    expect(theBar()).toHaveTextContent(SENDS_START_AGAIN_ON_THE_APP);
    expect(lucia).not.toHaveTextContent(SENDS_START_AGAIN_ON_THE_APP);
    await sendNc(user, await openTheTerminal(user), IP.lucia, NC_TO_THE_APP);
    expect(theBar()).not.toHaveTextContent(SENDS_START_AGAIN_ON_THE_APP);
  });

  it('02-13: dig of tienda.lucia.example draws a question to the resolver and ping of the same name draws none', async () => {
    const user = userEvent.setup();
    renderIncident('02-13');
    await drawWithoutAnimations(user);
    const terminal = await openTheTerminal(user);
    await sendNc(user, terminal, SHOP, DIG);
    expect(screen.getAllByRole('button', { name: STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER })).toHaveLength(1);
    expect(packetTags()).toEqual([TAG_OF_THE_QUESTION]);
    await sendNc(user, terminal, SHOP, PING);
    expect(screen.getByRole('button', { name: STAMP_OF_THE_PING_TO_THE_SHOP })).toBeVisible();
    expect(screen.getAllByRole('button', { name: STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER })).toHaveLength(1);
    expect(packetTags()).toEqual([TAG_OF_THE_QUESTION]);
    cleanup();
    renderIncident('02-13');
    await drawWithoutAnimations(user);
    await sendNc(user, await openTheTerminal(user), SHOP, PING);
    expect(screen.getByRole('button', { name: STAMP_OF_THE_PING_TO_THE_SHOP })).toBeVisible();
    expect(screen.queryAllByRole('button', { name: STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER })).toHaveLength(0);
    expect(packetTags()).toEqual([]);
  });

  async function nameTheRightCauseAndGoOn(user: User, spec: CaseSpec) {
    await user.click(screen.getByRole('button', { name: CASE_TEXT.know }));
    const right = toPlainText(spec.cause.options.find(({ correct }) => correct)?.text ?? '');
    await user.click(screen.getByRole('button', { name: (name) => name.includes(right) }));
    await user.click(screen.getByRole('button', { name: CASE_TEXT.next }));
  }

  async function renderOnCallAtCase(user: User, number: number) {
    const onCall = INCIDENTS.find(({ id }) => id === ON_CALL) as DiagnoseIncident;
    renderIncident(ON_CALL);
    await drawWithoutAnimations(user);
    for (const spec of onCall.diagnose.cases.slice(0, number - 1)) await nameTheRightCauseAndGoOn(user, spec);
  }

  const stampsOf = (pattern: RegExp) => screen.queryAllByRole('button', { name: pattern });

  it('02-14: case 1 draws the dig and the question of the ping and of the nc by name, each with its stamp at the resolver', async () => {
    const user = userEvent.setup();
    await renderOnCallAtCase(user, 1);
    const terminal = await openTheTerminal(user);
    for (const message of [DIG, PING, NC_TO_THE_WEB_PORT]) await sendMessage(user, terminal, message);
    expect(stampsOf(STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER), 'the dig and the two questions').toHaveLength(3);
    expect(stampsOf(STAMP_OF_THE_PING_TO_THE_NEW_SERVER)).toHaveLength(1);
    expect(stampsOf(STAMP_OF_THE_REFUSED_NC)).toHaveLength(1);
    expect(packetTags()).toEqual(TAGS_OF_THE_NAME_TESTS);
  });

  it('02-14: case 2 draws the question and its answer and the nc stays at its doorstep without a port', async () => {
    const user = userEvent.setup();
    await renderOnCallAtCase(user, 2);
    const terminal = await openTheTerminal(user);
    for (const message of [DIG, NC_TO_THE_WEB_PORT]) await sendMessage(user, terminal, message);
    expect(stampsOf(STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER), 'the dig and the question of the nc').toHaveLength(2);
    expect(stampsOf(STAMP_OF_THE_NC_WITH_NO_PORT)).toHaveLength(1);
    expect(stampsOf(/^Paquete: TCP \d+ → 80/), 'no nc ever leaves the laptop').toHaveLength(0);
    expect(packetTags()).toEqual(TAGS_OF_THE_TWO_QUESTIONS);
  });

  it('02-14: case 3 draws a question for the dig and none for the ping, which the hosts file answered', async () => {
    const user = userEvent.setup();
    await renderOnCallAtCase(user, 3);
    const terminal = await openTheTerminal(user);
    await sendMessage(user, terminal, DIG);
    expect(stampsOf(STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER)).toHaveLength(1);
    expect(packetTags()).toEqual([TAG_OF_THE_QUESTION]);
    await sendMessage(user, terminal, PING);
    expect(stampsOf(STAMP_OF_THE_PING_TO_THE_STALE_SHOP)).toHaveLength(1);
    expect(stampsOf(STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER)).toHaveLength(1);
    expect(packetTags()).toEqual([TAG_OF_THE_QUESTION]);
    cleanup();
    await renderOnCallAtCase(user, 3);
    await sendMessage(user, await openTheTerminal(user), PING);
    expect(stampsOf(STAMP_OF_THE_PING_TO_THE_STALE_SHOP)).toHaveLength(1);
    expect(stampsOf(STAMP_OF_ANY_QUESTION_TO_THE_RESOLVER)).toHaveLength(0);
    expect(packetTags()).toEqual([]);
  });

  it('in 02-14 case 5 can be repaired from the routes card', async () => {
    const user = userEvent.setup();
    await renderOnCallAtCase(user, LOOP_CASE);
    const onCall = INCIDENTS.find(({ id }) => id === ON_CALL) as DiagnoseIncident;
    const stamps = () => screen.queryAllByRole('button', { name: ANY_PACKET_STAMP }).map((stamp) => stamp.getAttribute('aria-label'));
    const fixTask = () => Array.from(screen.getByRole('region', { name: CASE_TEXT.title(LOOP_CASE, onCall.diagnose.cases.length) }).querySelectorAll('.tasks li'), ({ textContent }) => textContent).at(-1);
    const terminal = await openTheTerminal(user);
    for (const message of [PING, TRACEROUTE]) await sendMessage(user, terminal, message);
    expect(stamps()).toEqual([STAMP_OF_THE_LOOPING_PING, STAMP_OF_THE_LOOPING_TRACEROUTE]);
    expect(fixTask()).toBe(FIX_NOT_DONE);
    await user.click(screen.getByRole('button', { name: CASE_TEXT.know }));
    const right = toPlainText(onCall.diagnose.cases[LOOP_CASE - 1].cause.options.find(({ correct }) => correct)?.text ?? '');
    await user.click(screen.getByRole('button', { name: (name) => name.includes(right) }));
    expect(screen.getByText(CASE_TEXT.causeNamed), 'the cause is named and the case waits for the fix').toBeInTheDocument();
    expect(screen.queryByRole('button', { name: CASE_TEXT.next })).toBeNull();
    await user.click(screen.getByRole('button', { name: PROVIDER }));
    const routes = screen.getByRole('region', { name: PROVIDER });
    await user.click(within(routes).getByRole('button', { name: REMOVE_THE_DEFAULT_ROUTE }));
    await user.click(within(routes).getByRole('button', { name: SERVERS_BLOCK }));
    await user.click(within(routes).getByRole('button', { name: DESTINATION_HOP }));
    await user.click(within(routes).getByRole('button', { name: ADD_ROUTE }));
    expect(stamps(), 'writing a route clears the stamps').toEqual([]);
    expect(screen.queryByRole('button', { name: CASE_TEXT.next })).toBeNull();
    await sendMessage(user, await openTheTerminal(user), PING);
    expect(stamps()).toEqual([STAMP_OF_THE_PING_THAT_COMES_BACK]);
    expect(fixTask()).toBe(FIX_DONE);
    await user.click(screen.getByRole('button', { name: CASE_TEXT.next }));
    expect(screen.getByRole('region', { name: CASE_TEXT.title(LOOP_CASE + 1, onCall.diagnose.cases.length) })).toBeInTheDocument();
  });

  it('the still drawing of a translated packet shows the label of the leg where the packet stands', async () => {
    const user = userEvent.setup();
    renderIncident('02-08');
    await drawWithoutAnimations(user);
    const terminal = await openTheTerminal(user);
    await sendMessage(user, terminal, NC_TO_THE_WEB_PORT);
    const trace = document.querySelector('.map-trace');
    if (trace === null) throw new Error('the map drew no trace');
    const path = pathOf(trace);
    const standsBeforeTheRouter = distanceAlong(path, goingShapeOf(trace)) < distanceAlong(path, centerOfPiece('02-08', OFFICE_ROUTER_PIECE));
    expect(packetTags()).toEqual([standsBeforeTheRouter ? LABEL_BEFORE_THE_ROUTER : LABEL_AFTER_THE_ROUTER]);
  });

  it('starts checked from the system preference, and both incidents still reach 3 stars', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === SYSTEM_PREFERS_STILL, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));
    const consoleErrors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const finish = async (answer: RegExp) => {
      await sendTheSolution(user);
      await user.click(screen.getByRole('button', { name: answer }));
      await user.click(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult }));
      expect(screen.getByText(ROADMAP_TEXT.starsOf(FULL_STARS))).toBeVisible();
    };
    const first = renderIncident(FIRST.id, '04-02');
    expect(screen.getByLabelText(SCREEN_TEXT.motion)).toBeChecked();
    await placeRule(user, SG_SERVIDOR1);
    await finish(RIGHT_ANSWER);
    expect(screen.getByRole('link', { name: NEXT_INCIDENT })).toHaveAttribute('href', '#/level/04-02');
    first.unmount();
    renderIncident('04-02');
    expect(screen.getByLabelText(SCREEN_TEXT.motion)).toBeChecked();
    expect(screen.getAllByRole('listitem').find((task) => task.textContent?.includes(PING_TASK))).toHaveTextContent(LUCIA_TEXT.pending);
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    const card = screen.getByRole('region', { name: SG_SERVIDOR2 });
    await user.click(within(card).getByRole('button', { name: REPLY_RULE }));
    await user.click(within(card).getByRole('button', { name: ECHO_REQUEST }));
    await user.click(within(card).getByRole('button', { name: SG_SERVIDOR1 }));
    await finish(OPENING_RULE_ANSWER);
    expect(consoleErrors).not.toHaveBeenCalled();
  });

  it('an intrusion shows its alert inside the label of the device', async () => {
    const user = userEvent.setup();
    renderIncident(FIRST.id);
    await drawWithoutAnimations(user);
    await placeRule(user, ANYWHERE);
    expect(screen.getByRole('button', { name: ATTACKED_SERVER })).toBeVisible();
  });

  it('focus goes to the card heading when a Security Group opens, and back to it on Escape', async () => {
    const user = userEvent.setup();
    renderIncident(FIRST.id);
    const label = screen.getByRole('button', { name: SG_SERVIDOR2 });
    await tabTo(user, label);
    await user.keyboard('{Enter}');
    const card = screen.getByRole('region', { name: SG_SERVIDOR2 });
    expect(within(card).getByRole('heading', { level: 2 })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 }), 'Escape leaves the panel where it is').toBe(card);
    expect(label).toHaveFocus();
  });

  it('sending with Anywhere-IPv4 open gets Lucía\'s reply, and with the card still open the fix closes it and focuses the question', async () => {
    const consoleErrors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderIncident(FIRST.id);
    const card = await placeRule(user, ANYWHERE);
    await sendTheSolution(user);
    expect(screen.getByRole('status')).toHaveTextContent(LUCIA_TEXT.intruding);
    expect(screen.queryByRole('heading', { name: QUESTION })).toBeNull();
    await user.click(within(card).getByRole('button', { name: /^Quitar la regla/ }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.click(within(card).getByRole('button', { name: ECHO_REQUEST }));
    await user.click(within(card).getByRole('button', { name: SG_SERVIDOR1 }));
    await sendTheSolution(user);
    expect(screen.getByRole('heading', { name: QUESTION })).toHaveFocus();
    expect(within(card).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Estado']);
    expect(consoleErrors).not.toHaveBeenCalled();
  });

  it('03-07: the description of the button of servidor-nuevo lists proxy inverso and servidor web, and the one of servidor-app lists app', () => {
    renderIncident('03-07');
    expect(screen.getByRole('button', { name: 'servidor-nuevo con candado' })).toHaveAccessibleDescription('proxy inverso y servidor web');
    expect(screen.getByRole('button', { name: 'servidor-app con candado' })).toHaveAccessibleDescription('app, servidor de origen');
  });
});

describe('the status bar of the incident screen', () => {
  const SENDING = sendIncident();
  const ambient = (id: string, to: string) => ({ id, kind: 'ambient' as const, packet: ping(device('your-laptop'), to) });
  const WITH_FLOWS = { ...identifyIncident(), flows: [ambient('hum', OFFICE.printer), ambient('noise', OFFICE.lucia)] };
  const WITH_NO_FLOWS = identifyIncident();
  const FIRST_PING = 'ping de your-laptop a printer';
  const SECOND_PING = 'ping de your-laptop a lucia-laptop';
  const ARRIVED = 'Llegó y volvió la respuesta.';

  function renderOf(incident: Incident) {
    render(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={vi.fn()} />);
  }

  async function sendPing(user: User, address: string) {
    await user.click(pieceLabel('your-laptop'));
    const terminal = panelOfTheColumn();
    await user.click(within(terminal).getByRole('button', { name: address }));
    await user.click(within(terminal).getByRole('button', { name: 'ping' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  function newestLineOf(incidents: Incident[], id: string) {
    const [newest] = registryLines(startSession(incidents, id));
    if (newest?.kind !== 'packet') throw new Error(`${id} starts with no packet line`);
    return `${toPlainText(newest.label)} ${toPlainText(newest.result)}`;
  }

  it('the bar shows the newest line in a send incident, a filter incident, an identify with flows and an identify with none', async () => {
    const user = userEvent.setup();
    renderOf(SENDING);
    expect(theBar()).toHaveTextContent(SCREEN_TEXT.statusEmpty);
    await sendPing(user, OFFICE.printer);
    expect(theBar()).toHaveTextContent(`${FIRST_PING} ${ARRIVED}`);
    await sendPing(user, OFFICE.lucia);
    expect(theBar()).toHaveTextContent(`${SECOND_PING} ${ARRIVED}`);
    expect(theBar()).not.toHaveTextContent(FIRST_PING);
    cleanup();

    renderFirst();
    expect(theBar()).toHaveTextContent(newestLineOf(INCIDENTS, FIRST.id));
    cleanup();

    renderOf(WITH_FLOWS);
    expect(theBar()).toHaveTextContent(newestLineOf([WITH_FLOWS], WITH_FLOWS.id));
    expect(theBar()).not.toHaveTextContent(SCREEN_TEXT.statusEmpty);
    cleanup();

    renderOf(WITH_NO_FLOWS);
    expect(theBar()).toHaveTextContent(SCREEN_TEXT.statusEmpty);
  });

  it('the bar of 01-01 shows the empty line and names no term', () => {
    const office = INCIDENTS.find(({ id }) => id === '01-01');
    if (office === undefined) throw new Error('01-01 is not registered');
    expect(office.flows).toEqual([]);
    renderOf(office);
    expect(theBar()).toHaveTextContent(SCREEN_TEXT.statusEmpty);
    expect(theBar().querySelector('.term')).toBeNull();
    expect(SCREEN_TEXT.statusEmpty).toBe(toPlainText(SCREEN_TEXT.statusEmpty));
  });

  it('clicking the line of a send selects its packet and the panel shows its box', async () => {
    const user = userEvent.setup();
    renderOf(SENDING);
    await sendPing(user, OFFICE.printer);
    expect(panelOfTheColumn()).toHaveAccessibleName('your-laptop');
    await user.click(within(theBar()).getByRole('button'));
    expect(panelOfTheColumn()).toHaveAccessibleName(FIRST_PING);
    expect(panelOfTheColumn()).toHaveTextContent(ARRIVED);
    expect(panelOfTheColumn().querySelector('h2')).not.toHaveFocus();
  });

  it('a refused entry of a table is in the bar and the table keeps saying it', async () => {
    const user = userEvent.setup();
    const NAMES = namesSendIncident();
    render(<IncidentScreen incidents={[NAMES]} incidentId={NAMES.id} nextId={null} onFinish={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'servidor-autoritativo' }));
    const card = screen.getByRole('region', { name: 'servidor-autoritativo' });
    await user.click(within(card).getByRole('button', { name: 'www.lucia.example' }));
    await user.click(within(card).getByRole('button', { name: 'A' }));
    await user.click(within(card).getByRole('button', { name: '198.51.100.50' }));
    await user.click(within(card).getByRole('button', { name: 'Agregar registro' }));
    expect(within(card).getByRole('status')).toHaveTextContent('Ese registro ya está en la zona.');
    expect(theBar().querySelector('p.message')).toHaveClass('message--error');
    expect(theBar()).toHaveTextContent('Ese registro ya está en la zona.');
  });
});

describe('the registry of the status bar', () => {
  const GATEWAY = { ...gatewayIncident(), introduces: [...CHAPTER_1_TERMS] };
  const PRINTER = OFFICE_FLOORS.floor1.printer;
  const ANDRES = OFFICE_FLOORS.floor2.andres;
  const PING_PRINTER = 'ping de tu-laptop a impresora';
  const PING_ANDRES = 'ping de tu-laptop a 192.168.2.15';
  const PING_ANDRES_FOUND = 'ping de tu-laptop a laptop-andres';
  const NOTICE = 'Cambiaste la puerta de enlace predeterminada de tu-laptop: las pruebas de antes eran con la red anterior. Vuelve a mandarlas.';

  const registryButton = () => screen.getByRole('button', { name: /^Registro \(\d+\)$/ });
  const registryList = () => screen.getByRole('list', { name: /^Registro \(\d+\)$/ });
  const rows = () => within(registryList()).getAllByRole('listitem');

  function renderGateway(incident = GATEWAY) {
    render(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={vi.fn()} />);
  }

  async function sendTo(user: User, address: string) {
    await user.click(pieceLabel('tu-laptop'));
    const terminal = await showTab(user, panelOfTheColumn(), 'Terminal');
    await user.click(within(terminal).getByRole('button', { name: address }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  async function setTheGateway(user: User) {
    await user.click(pieceLabel('tu-laptop'));
    const settings = await showTab(user, panelOfTheColumn(), 'Ajustes');
    await user.click(within(settings).getByRole('button', { name: OFFICE_FLOORS.floor1.gateway }));
  }

  it('Registro (N) counts every line of the registry', async () => {
    const user = userEvent.setup();
    const office = INCIDENTS.find(({ id }) => id === '01-01');
    if (office === undefined) throw new Error('01-01 is not registered');
    render(<IncidentScreen incidents={[office]} incidentId={office.id} nextId={null} onFinish={vi.fn()} />);
    expect(registryButton()).toHaveTextContent('Registro (0)');
    expect(registryButton()).toBeDisabled();
    expect(theBar()).toHaveTextContent(SCREEN_TEXT.statusEmpty);
    cleanup();

    renderFirst();
    expect(registryButton()).toHaveTextContent(`Registro (${registryLines(startSession(INCIDENTS, FIRST.id)).length})`);
    expect(registryButton()).toBeEnabled();
    cleanup();

    renderGateway();
    await sendTo(user, PRINTER);
    await sendTo(user, ANDRES);
    expect(registryButton()).toHaveTextContent('Registro (2)');
    await setTheGateway(user);
    expect(registryButton()).toHaveTextContent('Registro (1)');
    await sendTo(user, PRINTER);
    expect(registryButton()).toHaveTextContent('Registro (2)');
  });

  it('opening the registry lists the lines newest first with the change that emptied the sends as the first', async () => {
    const user = userEvent.setup();
    renderGateway();
    await sendTo(user, ANDRES);
    expect(registryButton()).toHaveAttribute('aria-expanded', 'false');
    await setTheGateway(user);
    await sendTo(user, ANDRES);
    await sendTo(user, PRINTER);
    await user.click(registryButton());
    expect(registryButton()).toHaveAttribute('aria-expanded', 'true');
    expect(rows()).toHaveLength(3);
    expect(rows()[0]).toHaveTextContent(`${PING_PRINTER} Llegó y volvió la respuesta.`);
    expect(rows()[1]).toHaveTextContent(`${PING_ANDRES_FOUND} Llegó y volvió la respuesta.`);
    expect(rows()[2]).toHaveTextContent(NOTICE);
    expect(registryList()).not.toHaveTextContent(PING_ANDRES);
    await user.click(registryButton());
    expect(screen.queryByRole('list', { name: /^Registro/ })).toBeNull();
    expect(registryButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('consecutive lines with the same printed text are one row with its count and unfold on a click', async () => {
    const user = userEvent.setup();
    renderGateway();
    await sendTo(user, ANDRES);
    for (let times = 0; times < 3; times++) await sendTo(user, PRINTER);
    expect(registryButton()).toHaveTextContent('Registro (4)');
    await user.click(registryButton());
    expect(rows()).toHaveLength(2);
    const sameLine = () => within(registryList()).queryAllByRole('button', { name: new RegExp(`^${PING_PRINTER}`) });
    expect(sameLine()).toHaveLength(1);
    const count = within(registryList()).getByRole('button', { name: '3 veces' });
    expect(count).toHaveAttribute('aria-expanded', 'false');
    expect(within(registryList()).queryByRole('button', { name: /veces/ })).toBe(count);
    await user.click(count);
    expect(count).toHaveAttribute('aria-expanded', 'true');
    expect(sameLine()).toHaveLength(3);
    await user.click(count);
    expect(sameLine()).toHaveLength(1);
  });

  it('each line of the registry selects its packet', async () => {
    const user = userEvent.setup();
    renderGateway();
    await sendTo(user, ANDRES);
    await setTheGateway(user);
    await sendTo(user, ANDRES);
    await sendTo(user, PRINTER);
    await user.click(registryButton());
    await user.click(within(registryList()).getByRole('button', { name: new RegExp(`^${PING_ANDRES_FOUND}`) }));
    expect(panelOfTheColumn()).toHaveAccessibleName(PING_ANDRES_FOUND);
    await user.click(within(registryList()).getByRole('button', { name: new RegExp(`^${PING_PRINTER}`) }));
    expect(panelOfTheColumn()).toHaveAccessibleName(PING_PRINTER);
  });

  it('a change of the network while the registry is open leaves only the change line and N counts again', async () => {
    const user = userEvent.setup();
    renderGateway();
    await sendTo(user, ANDRES);
    await sendTo(user, PRINTER);
    await user.click(registryButton());
    expect(rows()).toHaveLength(2);
    await setTheGateway(user);
    expect(registryButton()).toHaveTextContent('Registro (1)');
    expect(registryButton()).toHaveAttribute('aria-expanded', 'true');
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent(NOTICE);
    expect(registryList()).not.toHaveTextContent(PING_PRINTER);
  });

  function withTheServer(incident: SendIncident): SendIncident {
    return { ...incident, send: { ...incident.send, to: [...incident.send.to, { id: 'server', address: OFFICE_FLOORS.server.ip }] } };
  }

  describe('Ver fila', () => {
    const SERVER = OFFICE_FLOORS.server.ip;
    const ROUTED = withTheServer(gatewayIncident());
    const SEE_ROW = 'Ver fila';
    const seeRowButton = () => screen.getByRole('button', { name: SEE_ROW });
    const rowsInUse = () =>
      within(panelOfTheColumn())
        .getAllByRole('row')
        .filter((row) => within(row).queryByText('en uso') !== null)
        .map((row) => row.textContent);

    async function routedWithTheGateway(user: User) {
      renderGateway(ROUTED);
      await setTheGateway(user);
    }

    it('Ver fila selects the router, opens Tablas and its ficha of routes and marks the row of that send, not the last one', async () => {
      const user = userEvent.setup();
      await routedWithTheGateway(user);
      await sendTo(user, ANDRES);
      await sendTo(user, SERVER);
      await user.click(registryButton());
      await user.click(within(rows()[1]).getByRole('button', { name: SEE_ROW }));
      const panel = panelOfTheColumn();
      expect(panel).toHaveAccessibleName('router-office');
      expect(within(panel).getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
      expect(within(panel).getByRole('tab', { name: 'Tabla de rutas' })).toHaveAttribute('aria-selected', 'true');
      expect(within(panel).getByRole('table', { name: 'Tabla de rutas de router-office' })).toBeInTheDocument();
      expect(rowsInUse()).toHaveLength(1);
      expect(rowsInUse()[0]).toContain('192.168.2.0/24');
      await user.click(within(rows()[0]).getByRole('button', { name: SEE_ROW }));
      expect(rowsInUse()).toHaveLength(1);
      expect(rowsInUse()[0]).toContain('0.0.0.0/0');
      await user.click(within(rows()[1]).getByRole('button', { name: SEE_ROW }));
      await user.click(pieceLabel('impresora'));
      await user.click(pieceLabel('router-office'));
      expect(within(panelOfTheColumn()).getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
      expect(rowsInUse()[0]).toContain('0.0.0.0/0');
    });

    it('the line of the bar has its Ver fila too', async () => {
      const user = userEvent.setup();
      await routedWithTheGateway(user);
      await sendTo(user, PRINTER);
      await sendTo(user, ANDRES);
      await sendTo(user, PRINTER);
      await user.click(seeRowButton());
      expect(rowsInUse()[0]).toContain('192.168.1.0/24');
      expect(theBar()).not.toContainElement(seeRowButton());
    });

    it('a send that never left has no Ver fila', async () => {
      const user = userEvent.setup();
      renderGateway(ROUTED);
      await sendTo(user, ANDRES);
      expect(theBar()).toHaveTextContent(PING_ANDRES);
      expect(screen.queryByRole('button', { name: SEE_ROW })).toBeNull();
      await setTheGateway(user);
      await sendTo(user, ANDRES);
      expect(theBar()).toHaveTextContent(PING_ANDRES_FOUND);
      expect(seeRowButton()).toBeInTheDocument();
    });

    it('a send with the routing table still unknown has no Ver fila', async () => {
      const user = userEvent.setup();
      renderGateway();
      await sendTo(user, PRINTER);
      expect(theBar()).toHaveTextContent(PING_PRINTER);
      expect(screen.queryByRole('button', { name: SEE_ROW })).toBeNull();
      cleanup();
      renderGateway(ROUTED);
      await sendTo(user, PRINTER);
      expect(seeRowButton()).toBeInTheDocument();
    });

    it('Ver fila leaves the focus on the heading of the panel', async () => {
      const user = userEvent.setup();
      await routedWithTheGateway(user);
      await sendTo(user, PRINTER);
      await user.click(pieceLabel('impresora'));
      await user.click(seeRowButton());
      expect(panelOfTheColumn().querySelector('h2')).toHaveFocus();
      await user.click(pieceLabel('impresora'));
      seeRowButton().focus();
      await user.keyboard('{Enter}');
      expect(panelOfTheColumn()).toHaveAccessibleName('tu-laptop');
      expect(panelOfTheColumn().querySelector('h2')).toHaveFocus();
    });
  });
});
