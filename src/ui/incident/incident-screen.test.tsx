// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASE_TEXT, EXPLANATION_TEXT, INSPECTION_TEXT, LUCIA_TEXT, OUTCOME_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, TERMS, toPlainText } from '@/copy';
import { pieceViews, startSession } from '@/game';
import { INCIDENTS, knownTerms, type CaseSpec, type DiagnoseIncident, type SendIncident } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { layoutMap } from '@/scene/layout/map-layout';
import { GLYPH_BOX } from '@/scene/marks/still-packets';
import { CHAPTER_1_TERMS, NOTE_RULE, diagnoseIncident, filterIncident, gatewayIncident, identifyIncident, namesSendIncident, repairableDiagnoseIncident, sendIncident } from '@/testing/incidents';
import { IncidentScreen } from './incident-screen';
import type { Frame } from './inspection-place';

const scene = vi.hoisted(() => ({ drawsItsCards: true, drawsTheList: false, drawsTheRealMap: false, sheet: { width: 1060, height: 800 } }));

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/hooks')>()),
  useElementSize: () => ({ ref: () => undefined, ...scene.sheet }),
}));

vi.mock('@/scene/game-scene', async () => {
  const { GameScene: TheRealMap } = await vi.importActual<typeof import('@/scene/game-scene')>('@/scene/game-scene');
  const { PieceLabel } = await vi.importActual<typeof import('@/scene/overlay/piece-label')>('@/scene/overlay/piece-label');
  const { toPlainText } = await vi.importActual<typeof import('@/copy')>('@/copy');
  const PlainScene = ({ pieces, flows, sent, overlay, inspectTrigger, inspectStampsTrigger, onActivate, known }: GameSceneProps) => (
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
      {overlay && scene.drawsItsCards && <div className="map-card">{overlay}</div>}
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
const ANYWHERE = 'Anywhere-IPv4 (0.0.0.0/0)';
const FULL_STARS = 3;
const FIRST = filterIncident('04-01');
const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;
const QUESTION = toPlainText(EXPLANATION_TEXT.asks(EXPLANATION_TEXT.whatHappened));
const BEFORE_THE_GRACE_ENDS_MS = 100;
const AFTER_THE_GRACE_ENDS_MS = 1000;
const TAB_STOPS_LIMIT = 80;
const TAP = '[TouchA]';

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

function expectCardKeepsTheFocusAndItsBoxIsPinned() {
  const card = screen.getByRole('dialog', { name: SG_SERVIDOR2 });
  expect(within(card).getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
  expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toHaveTextContent(INSPECTION_TEXT.pinned);
}

async function pinTheStampWithTheKeyboard(user: User) {
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
  const card = screen.getByRole('dialog', { name: SG_SERVIDOR2 });
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
  const terminal = screen.getByRole('dialog', { name: 'Terminal de tu-laptop' });
  await user.click(within(terminal).getByRole('button', { name: '192.168.2.15' }));
  await user.click(within(terminal).getByRole('button', { name: 'traceroute' }));
  await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
}

describe('incident screen', () => {
  it('explains the stamps and the lock beside the inspect help, and stops while a piece is inspected', async () => {
    const user = userEvent.setup();
    renderFirst();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    expect(screen.getByText(SCREEN_TEXT.stampLegend)).toBeInTheDocument();
    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));
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
    expect(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
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
    await user.click(within(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).getByRole('button', { name: ECHO_REQUEST }));
    await user.click(screen.getByRole('button', { name: OTHER_DOOR }));
    const card = screen.getByRole('dialog', { name: OTHER_DOOR });
    expect(within(card).queryByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) })).toBeNull();
    expect(within(card).getByRole('button', { name: ECHO_REQUEST, pressed: false })).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: OTHER_DOOR })).toHaveFocus();
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
    expect(screen.queryByRole('dialog')).toBeNull();
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

describe('a floating inspection box can be pinned', () => {
  it('clicking a stamp pins its box with «Fijada» and «Cerrar», and hovering another piece leaves it', async () => {
    const user = renderWithFakeTimers();
    const stamp = screen.getByRole('button', { name: ATTACKER_PACKET });
    await user.click(stamp);
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expect(box).toHaveTextContent(INSPECTION_TEXT.pinned);
    expect(within(box).getByRole('button', { name: INSPECTION_TEXT.closeLabel })).toHaveTextContent(INSPECTION_TEXT.close);
    expect(stamp).toHaveAttribute('data-pinned');
    const piece = screen.getByRole('button', { name: LOCKED_SERVER });
    await user.hover(piece);
    await user.unhover(piece);
    await user.unhover(stamp);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: ATTACKER_PACKET })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
    expect(piece).not.toHaveAttribute('data-pinned');
  });

  it('with touch, a tap pins the box and a tap outside releases it', async () => {
    const user = renderWithFakeTimers();
    const stamp = screen.getByRole('button', { name: ATTACKER_PACKET });

    await user.pointer({ keys: TAP, target: stamp });

    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expect(box).toHaveTextContent(INSPECTION_TEXT.pinned);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(box, 'the pinned box stays after the finger lifts').toBeInTheDocument();

    await user.pointer({ keys: TAP, target: screen.getByRole('heading', { level: 1 }) });

    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
  });

  it('a box that is only a preview shows neither «Fijada» nor «Cerrar»', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.hover(screen.getByRole('button', { name: ATTACKER_PACKET }));
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expect(box).not.toHaveTextContent(INSPECTION_TEXT.pinned);
    expect(within(box).queryByRole('button', { name: INSPECTION_TEXT.closeLabel })).toBeNull();
  });

  it('Enter on a stamp pins its box and puts the focus on its heading; Escape gives the focus back to the stamp', async () => {
    const user = userEvent.setup();
    renderFirst();
    const stamp = await pinTheStampWithTheKeyboard(user);
    const box = screen.getByRole('region', { name: ATTACKER_PACKET });
    expect(box).toHaveTextContent(INSPECTION_TEXT.pinned);
    expect(within(box).getByRole('heading', { name: ATTACKER_PACKET })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
    expect(stamp).toHaveFocus();
  });

  it('Shift+Tab from the heading of a pinned box reaches «Cerrar», and Enter on it releases the box and gives the focus back to the stamp', async () => {
    const user = userEvent.setup();
    renderFirst();
    const stamp = await pinTheStampWithTheKeyboard(user);
    await user.tab({ shift: true });
    expect(within(screen.getByRole('region', { name: ATTACKER_PACKET })).getByRole('button', { name: INSPECTION_TEXT.closeLabel })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
    expect(stamp).toHaveFocus();
  });

  it("clicking a piece that opens a card opens it, keeps the focus in it and pins the piece's box", async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    expectCardKeepsTheFocusAndItsBoxIsPinned();
  });

  it("Enter on a piece that opens a card keeps the focus in the card and pins the piece's box", async () => {
    const user = userEvent.setup();
    renderFirst();
    await tabTo(user, screen.getByRole('button', { name: SG_SERVIDOR2 }));
    await user.keyboard('{Enter}');
    expectCardKeepsTheFocusAndItsBoxIsPinned();
  });

  it('a box pinned with the keyboard on a piece that opens a card does not take the focus when the phase changes', async () => {
    const user = userEvent.setup();
    renderFirst();
    await tabTo(user, screen.getByRole('button', { name: SG_SERVIDOR2 }));
    await user.keyboard('{Enter}');
    const card = screen.getByRole('dialog', { name: SG_SERVIDOR2 });
    await tabTo(user, within(card).getByRole('button', { name: ECHO_REQUEST }));
    await user.keyboard('{Enter}');
    await tabTo(user, within(card).getByRole('button', { name: SG_SERVIDOR1 }));
    await user.keyboard('{Enter}');
    await tabTo(user, screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toHaveTextContent(INSPECTION_TEXT.pinned);
    expect(screen.getByRole('heading', { name: QUESTION })).toHaveFocus();
  });

  it('Escape inside a card opened from a pinned piece closes the card, releases the box and leaves the focus on the piece', async () => {
    const user = userEvent.setup();
    renderFirst();
    const label = screen.getByRole('button', { name: SG_SERVIDOR2 });
    await user.click(label);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('region', { name: SG_SERVIDOR2 })).toBeNull();
    expect(label).toHaveFocus();
    expect(label).not.toHaveAttribute('data-pinned');
  });

  it('«Cerrar» unpins the box', async () => {
    const user = userEvent.setup();
    renderFirst();
    const stamp = screen.getByRole('button', { name: ATTACKER_PACKET });
    await user.click(stamp);
    await user.click(within(screen.getByRole('region', { name: ATTACKER_PACKET })).getByRole('button', { name: INSPECTION_TEXT.closeLabel }));
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    expect(stamp).not.toHaveAttribute('data-pinned');
    expect(stamp).toHaveFocus();
  });

  it('a click on another piece releases the box and pins the box of that piece', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByRole('region', { name: ATTACKER_PACKET })).toBeNull();
    expect(screen.getByRole('region', { name: 'servidor2' })).toHaveTextContent(INSPECTION_TEXT.pinned);
  });
});

describe('a pinned inspection box whose piece is gone', () => {
  const GATEWAY = gatewayIncident();
  const SETTINGS = 'Ajustes de red de tu-laptop';
  const ROUTER = '192.168.1.1';
  const LOST_PING = 'ping de tu-laptop a 192.168.2.15';

  it('a pinned box whose piece is gone is released', async () => {
    const user = userEvent.setup();
    render(<IncidentScreen incidents={[GATEWAY]} incidentId={GATEWAY.id} nextId={null} onFinish={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    const terminal = screen.getByRole('dialog', { name: /^Terminal de/ });
    await user.click(within(terminal).getByRole('button', { name: '192.168.2.15' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
    await user.click(screen.getByRole('button', { name: LOST_PING }));
    expect(screen.getByRole('region', { name: LOST_PING })).toHaveTextContent(INSPECTION_TEXT.pinned);

    await tabTo(user, within(screen.getByRole('dialog', { name: /^Terminal de/ })).getByRole('tab', { name: 'Terminal' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('region', { name: LOST_PING })).toHaveTextContent(INSPECTION_TEXT.pinned);
    await tabTo(user, within(screen.getByRole('dialog', { name: SETTINGS })).getByRole('button', { name: ROUTER }));
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('button', { name: LOST_PING })).toBeNull();
    expect(screen.queryByRole('region', { name: LOST_PING })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    await user.hover(screen.getByRole('button', { name: 'tu-laptop' }));
    expect(screen.getByRole('region', { name: 'tu-laptop' })).not.toHaveTextContent(INSPECTION_TEXT.pinned);
  });
});

describe('the inspection box steps aside from an open card', () => {
  const MAP: Frame = { left: 0, top: 0, right: 1060, bottom: 900 };
  const NOTHING: Frame = { left: 0, top: 0, right: 0, bottom: 0 };
  const DOCKED_AT_THE_LEFT: Frame = { left: 6, top: 582, right: 306, bottom: 894 };
  const AT_THE_RIGHT: Frame = { left: 535, top: 203, right: 835, bottom: 589 };
  const OVER_THE_TOP_OF_THE_TALLEST_BOX: Frame = { left: 700, top: 300, right: 1000, bottom: 600 };
  const FAR_FROM_BOTH: Frame = { left: 400, top: 100, right: 600, bottom: 300 };
  const OVER_BOTH: Frame = { left: 300, top: 600, right: 700, bottom: 880 };
  const BOX_BOTTOM = 884;
  const BOX_LEFT = 692;
  const BOX_WIDTH = 352;
  const SHORT_BOX = 100;
  const TALL_BOX = 300;
  const MOVED = 'translate(1px, 1px)';
  const rects: { card: Frame } = { card: NOTHING };

  function domRect({ left, top, right, bottom }: Frame): DOMRect {
    return { left, top, right, bottom, x: left, y: top, width: right - left, height: bottom - top, toJSON: () => ({}) };
  }

  function drawTheMap(card: Frame) {
    rects.card = card;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.matches('.incident__map')) return domRect(MAP);
      if (this.matches('.map-card')) return domRect(rects.card);
      if (!this.matches('.incident__inspection')) return domRect(NOTHING);
      const height = this.querySelector('h2')?.textContent === 'servidor2' ? SHORT_BOX : TALL_BOX;
      return domRect({ left: BOX_LEFT, top: BOX_BOTTOM - height, right: BOX_LEFT + BOX_WIDTH, bottom: BOX_BOTTOM });
    });
  }

  function theHolder() {
    const holder = document.querySelector('.incident__inspection');
    if (holder === null) throw new Error('the inspection holder is not on the page');
    return holder;
  }

  async function moveTheCardTo(card: Frame) {
    rects.card = card;
    await act(async () => {
      document.querySelector('.map-card')?.setAttribute('style', `transform: ${MOVED}`);
    });
  }

  async function openTheCardAndLetGoOfItsBox(user: User) {
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    const card = screen.queryByRole('dialog', { name: SG_SERVIDOR2 });
    if (card !== null) await user.click(within(card).getByRole('heading', { name: SG_SERVIDOR2 }));
  }

  afterEach(() => {
    vi.restoreAllMocks();
    scene.drawsItsCards = true;
  });

  it('a box with no card open takes the right place', async () => {
    drawTheMap(NOTHING);
    const user = userEvent.setup();
    renderFirst();
    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
    expect(theHolder()).toHaveAttribute('data-place', 'right');
  });

  it('a pinned box moves to the other place when the card takes its own', async () => {
    drawTheMap(DOCKED_AT_THE_LEFT);
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    expect(theHolder()).toHaveAttribute('data-place', 'right');
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toHaveTextContent(INSPECTION_TEXT.pinned);

    await moveTheCardTo(AT_THE_RIGHT);

    expect(theHolder()).toHaveAttribute('data-place', 'left');
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toHaveTextContent(INSPECTION_TEXT.pinned);

    await moveTheCardTo(FAR_FROM_BOTH);

    expect(theHolder(), 'a box that the card does not touch keeps the place it has').toHaveAttribute('data-place', 'left');
  });

  it('a pinned box is released, and its piece wears no pin, when the card takes both places', async () => {
    drawTheMap(OVER_BOTH);
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    expect(screen.queryByRole('region', { name: SG_SERVIDOR2 })).toBeNull();
    expect(screen.getByRole('button', { name: SG_SERVIDOR2 })).not.toHaveAttribute('data-pinned');
    expect(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).toBeInTheDocument();
  });

  it('a preview is not drawn when the card takes both places', async () => {
    drawTheMap(OVER_BOTH);
    const user = userEvent.setup();
    renderFirst();
    await openTheCardAndLetGoOfItsBox(user);
    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
  });

  it('a click on another piece shows no pinned box, and its piece wears no pin, when the card takes both places', async () => {
    drawTheMap(OVER_BOTH);
    const user = userEvent.setup();
    renderFirst();
    await openTheCardAndLetGoOfItsBox(user);
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
    expect(screen.getByRole('button', { name: LOCKED_SERVER })).not.toHaveAttribute('data-pinned');
  });

  it('the box of the click that opens a card is not drawn until the card is measured', async () => {
    drawTheMap(AT_THE_RIGHT);
    scene.drawsItsCards = false;
    const user = userEvent.setup();
    const view = render(firstScreen());
    await user.hover(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    expect(theHolder(), 'the preview that was up before the click').not.toHaveAttribute('data-hold');

    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));

    expect(theHolder(), 'the card is asked for and not in the map yet').toHaveAttribute('data-hold');
    expect(theHolder()).toHaveAttribute('data-place', 'right');

    scene.drawsItsCards = true;
    await act(async () => {
      view.rerender(firstScreen());
    });

    expect(theHolder()).not.toHaveAttribute('data-hold');
    expect(theHolder(), 'the card is measured before the box shows').toHaveAttribute('data-place', 'left');
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toHaveTextContent(INSPECTION_TEXT.pinned);
  });

  it('the reason is written when a piece is inspected and the card takes both places', async () => {
    drawTheMap(OVER_BOTH);
    const user = userEvent.setup();
    renderFirst();
    expect(screen.queryByText(SCREEN_TEXT.noRoomForTheBox), 'no card is open, so nothing to explain').toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectPinHelp), 'with no card the grey help promises the pinned box').toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));

    const reason = screen.getByText(SCREEN_TEXT.noRoomForTheBox);
    expect(reason, 'a note, in the side panel, right under the card of Lucía').toHaveClass('message--note');
    expect(reason.closest('.incident__side')).not.toBeNull();
    expect(reason.previousElementSibling).toBe(screen.getByRole('region', { name: /Lucía/ }));
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    expect(screen.queryByText(SCREEN_TEXT.inspectPinHelp), 'with a card open the grey help no longer promises the pinned box').toBeNull();

    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));
    await user.unhover(screen.getByRole('button', { name: LOCKED_SERVER }));

    expect(screen.getByText(SCREEN_TEXT.noRoomForTheBox), 'it stays while the card is open, so it does not blink').toBeInTheDocument();

    await user.click(within(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).getByRole('button', { name: TASK_CARD_TEXT.done }));

    expect(screen.queryByText(SCREEN_TEXT.noRoomForTheBox), 'it goes with the card').toBeNull();
  });

  it('the reason is written at a hover that finds no room, with no click on a piece', async () => {
    drawTheMap(DOCKED_AT_THE_LEFT);
    const user = userEvent.setup();
    renderFirst();
    await openTheCardAndLetGoOfItsBox(user);
    await moveTheCardTo(OVER_BOTH);

    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));

    expect(screen.queryByRole('region', { name: 'servidor2' })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.noRoomForTheBox)).toBeInTheDocument();
  });

  it('no reason is written while the card leaves a place free, and it goes when the card moves away and the box shows', async () => {
    drawTheMap(DOCKED_AT_THE_LEFT);
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toBeInTheDocument();
    expect(screen.queryByText(SCREEN_TEXT.noRoomForTheBox)).toBeNull();

    await moveTheCardTo(OVER_BOTH);
    expect(screen.queryByRole('region', { name: SG_SERVIDOR2 })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.noRoomForTheBox)).toBeInTheDocument();

    await moveTheCardTo(FAR_FROM_BOTH);
    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));

    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
    expect(screen.queryByText(SCREEN_TEXT.noRoomForTheBox), 'the card no longer takes the place, so the reason is no longer true').toBeNull();
  });

  it('the place does not change from one piece to the next while the card stays', async () => {
    drawTheMap(OVER_THE_TOP_OF_THE_TALLEST_BOX);
    const user = userEvent.setup();
    renderFirst();
    await openTheCardAndLetGoOfItsBox(user);

    await user.hover(screen.getByRole('button', { name: LOCKED_SERVER }));
    expect(screen.getByRole('region', { name: 'servidor2' })).toBeInTheDocument();
    expect(theHolder(), 'a short box, which the card would not touch').toHaveAttribute('data-place', 'left');

    await user.hover(screen.getByRole('button', { name: OTHER_DOOR }));
    expect(screen.getByRole('region', { name: OTHER_DOOR })).toBeInTheDocument();
    expect(theHolder(), 'a tall box, which it would').toHaveAttribute('data-place', 'left');
  });
});

describe('incident screen of a send incident', () => {
  const SENDING = sendIncident();
  const TERMINAL = 'Terminal de your-laptop';

  function renderSending() {
    render(<IncidentScreen incidents={[SENDING]} incidentId={SENDING.id} nextId={null} onFinish={vi.fn()} />);
  }

  function terminal(): HTMLElement {
    return screen.getByRole('dialog', { name: /^Terminal de/ });
  }

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
    expect(screen.getByRole('dialog', { name: TERMINAL })).toBeInTheDocument();
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
    expect(terminal()).toHaveAccessibleName('Terminal de Atacante');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Atacante' })).toHaveFocus();
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
  const SETTINGS = 'Ajustes de red de tu-laptop';
  const SETTINGS_TAB = 'Ajustes de red';
  const ROUTER = '192.168.1.1';
  const LOST_PING = 'ping de tu-laptop a 192.168.2.15';
  const PING_ANDRES = 'ping de tu-laptop a laptop-andres';

  const TRACING = tracingIncident();

  function renderGateway() {
    render(<IncidentScreen incidents={[GATEWAY]} incidentId={GATEWAY.id} nextId={null} onFinish={vi.fn()} />);
  }

  async function sendToAndres(user: User) {
    const terminal = screen.getByRole('dialog', { name: /^Terminal de/ });
    await user.click(within(terminal).getByRole('button', { name: '192.168.2.15' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  it('the laptop opens one card from its only button, with its terminal first and its settings in a tab, and the terminal offers no setting', async () => {
    const user = userEvent.setup();
    renderGateway();
    expect(screen.getAllByRole('button', { name: /^tu-laptop/ })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    const terminal = screen.getByRole('dialog', { name: 'Terminal de tu-laptop' });
    expect(within(terminal).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Terminal', SETTINGS_TAB]);
    expect(within(terminal).getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
    expect(within(terminal).queryByRole('group', { name: TERMS['default-gateway'].name })).toBeNull();
    expect(within(terminal).queryByRole('button', { name: ROUTER })).toBeNull();
    await user.click(within(terminal).getByRole('tab', { name: SETTINGS_TAB }));
    expect(screen.queryByRole('dialog', { name: 'Terminal de tu-laptop' })).toBeNull();
    const card = screen.getByRole('dialog', { name: SETTINGS });
    expect(within(card).getByRole('group', { name: TERMS['default-gateway'].name })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SETTINGS })).toBeInTheDocument();
  });

  it('setting the gateway on the tab makes the ping come back and clears the stamps of before, and Esc gives the focus back to the only button of the label', async () => {
    const user = userEvent.setup();
    renderGateway();
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await sendToAndres(user);
    expect(screen.getByRole('button', { name: LOST_PING })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: SETTINGS_TAB }));
    await user.click(within(screen.getByRole('dialog', { name: SETTINGS })).getByRole('button', { name: ROUTER }));
    expect(screen.queryByRole('button', { name: LOST_PING })).toBeNull();
    expect(screen.getByRole('button', { name: ROUTER })).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
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
    const reason = within(screen.getByRole('dialog', { name: 'Terminal de tu-laptop' })).getByText(OUTCOME_TEXT['no-route']);
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
    await user.click(screen.getByRole('button', { name: PRINTER_CARD }));
    expect(screen.getByRole('dialog', { name: PRINTER_CARD })).toHaveTextContent('¿Cuál es su dirección IP?');
  });

  it('a pick does not tick the task until Listo, and Escape gives the focus back to the piece', async () => {
    const user = userEvent.setup();
    renderIdentifying();
    await user.click(screen.getByRole('button', { name: PRINTER_CARD }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '192.168.1.21' }));
    expect(taskItem(PRINTER_TASK)).toHaveTextContent(LUCIA_TEXT.pending);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: PRINTER_CARD })).toHaveFocus();
    expect(taskItem(PRINTER_TASK)).toHaveTextContent(LUCIA_TEXT.pending);
  });

  it('Listo with the right IP ticks the task and shows the line with the rule of the note, and sending the solution then closes the incident', async () => {
    const user = userEvent.setup();
    renderIdentifying();
    await user.click(screen.getByRole('button', { name: GUEST_CARD }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'No' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(taskItem(GUEST_TASK)).toHaveTextContent(LUCIA_TEXT.done);

    await user.click(screen.getByRole('button', { name: PRINTER_CARD }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '192.168.1.21' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(screen.getByRole('dialog', { name: PRINTER_CARD })).toHaveTextContent(`Correcto. ${NOTE_RULE}`);
    expect(taskItem(PRINTER_TASK)).toHaveTextContent(LUCIA_TEXT.done);

    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.queryByRole('dialog')).toBeNull();
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
    const terminal = screen.getByRole('dialog', { name: /^Terminal de/ });
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
  const ROUTES = 'Tabla de rutas de router-provider';
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
    const table = screen.getByRole('dialog', { name: ROUTES });
    await user.click(within(table).getByRole('button', { name: /^Quitar 0\.0\.0\.0\/0/ }));
    await user.click(within(table).getByRole('button', { name: '198.51.100.0/24' }));
    await user.click(within(table).getByRole('button', { name: 'router-backbone' }));
    await user.click(within(table).getByRole('button', { name: 'Agregar ruta' }));
    await user.keyboard('{Escape}');
  }

  async function pingTheServer(user: User) {
    await user.click(screen.getByRole('button', { name: 'laptop-marta' }));
    const terminal = screen.getByRole('dialog', { name: /^Terminal de/ });
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
    const table = screen.getByRole('dialog', { name: ROUTES });
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
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: TASK_CARD_TEXT.done }));
    expectDrawnBy(NOTE_FEEDBACK, 'error');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '192.168.1.21' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: TASK_CARD_TEXT.done }));
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
  const CLOCK = 'Reloj del juego';
  const ONE_MINUTE = 'Esperar 1 min';
  const FIVE_MINUTES = 'Esperar 5 min';
  const RESOLVER = 'servidor-dns';
  const DIG_ANSWER = 'Salida de dig';

  function renderNames(incident = NAMES) {
    render(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={vi.fn()} />);
  }

  const digTheName = (user: User) => sendByName(user, 'dig');

  async function sendByName(user: User, message: string) {
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    const terminal = screen.getByRole('dialog', { name: 'Terminal de tu-laptop' });
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
    const cache = screen.getByRole('dialog', { name: 'Caché de servidor-dns' });
    expect(within(cache).getByRole('row', { name: new RegExp(WWW) })).toHaveTextContent('300 s');
    await user.click(screen.getByRole('button', { name: ONE_MINUTE }));
    expect(clock()).toHaveTextContent('1 min 00 s');
    expect(within(screen.getByRole('dialog', { name: 'Caché de servidor-dns' })).getByRole('row', { name: new RegExp(WWW) })).toHaveTextContent('240 s');
    await user.click(screen.getByRole('button', { name: FIVE_MINUTES }));
    expect(clock()).toHaveTextContent('6 min 00 s');
    expect(within(screen.getByRole('dialog', { name: 'Caché de servidor-dns' })).queryByRole('row', { name: new RegExp(WWW) })).toBeNull();
    expect(within(screen.getByRole('dialog', { name: 'Caché de servidor-dns' })).getByText('No hay respuestas guardadas.')).toBeInTheDocument();
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
    const tables = screen.getByRole('dialog', { name: 'Tabla de rutas de router-office' });
    expect(within(tables).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Tabla de rutas', 'Tabla de traducciones']);
    await user.click(within(tables).getByRole('tab', { name: 'Tabla de traducciones' }));
    expect(screen.getByRole('dialog', { name: 'Tabla de traducciones de router-office' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'router-office' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RESOLVER }));
    expect(screen.queryAllByRole('tab')).toEqual([]);
    expect(screen.getByRole('dialog', { name: 'Caché de servidor-dns' })).toBeInTheDocument();
  });

  it('a refused entry of a table is drawn by Message in a region that was already there, with no alert outside a message', async () => {
    const user = userEvent.setup();
    renderNames();
    await user.click(screen.getByRole('button', { name: 'servidor-autoritativo' }));
    const card = screen.getByRole('dialog', { name: 'Registros de lucia.example' });
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
  const IP = { marta: '192.168.1.12', lucia: '192.168.1.11', andres: '192.168.2.15', router: '192.168.1.1', loopback: '127.0.0.1' };
  const LUCIA = 'laptop-lucia';
  const SETTINGS_TAB = 'Ajustes de red';
  const SETTINGS_CARD = 'Ajustes de red de tu-laptop';
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
    await user.click(screen.getByRole('button', { name: laptop }));
    return screen.getByRole('dialog', { name: `Terminal de ${laptop}` });
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

  async function confirm(user: User, card: HTMLElement) {
    await user.click(within(card).getByRole('button', { name: TASK_CARD_TEXT.done }));
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
    const settings = screen.getByRole('dialog', { name: SETTINGS_CARD });
    await user.click(within(settings).getByRole('button', { name: IP.router }));
    expect(screen.queryAllByRole('button', { name: ANY_PACKET_STAMP })).toHaveLength(0);
    await confirm(user, settings);
    expect(settings).not.toBeInTheDocument();
    await sendTo(user, await openTheTerminal(user), IP.andres);
    expect(screen.getByRole('button', { name: ARRIVED_AT_ANDRES })).toBeVisible();
  });

  it('in 13 the tabs Entrada and Salida of the firewall card are reached and switched with the keyboard', async () => {
    const user = userEvent.setup();
    renderIncident('01-13');
    await user.click(screen.getByRole('button', { name: 'firewall tu-laptop' }));
    const firewall = screen.getByRole('dialog', { name: 'firewall tu-laptop' });
    const [inbound, outbound] = [/^entrada$/i, /^salida$/i].map((name) => within(firewall).getByRole('tab', { name }));
    expect(within(firewall).getByRole('heading', { level: 2 })).toHaveFocus();
    await user.tab();
    expect(inbound).toHaveFocus();
    expect(inbound).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(outbound).toHaveFocus();
    expect(outbound).toHaveAttribute('aria-selected', 'true');
    expect(inbound).toHaveAttribute('aria-selected', 'false');
    expect(within(firewall).getByRole('tabpanel')).toHaveTextContent('cerrada');
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
    await confirm(user, terminal);
    expect(terminal).not.toBeInTheDocument();
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
    await confirm(user, first);
    expect(first).not.toBeInTheDocument();
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
    await confirm(user, yours);
    expect(yours).not.toBeInTheDocument();
    const hers = await openTheTerminal(user, LUCIA);
    await sendNc(user, hers, IP.loopback, NC_TO_THE_APP);
    await confirm(user, hers);
    expect(hers).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: STAMP_OF_HER_OWN_APP })).toBeVisible();
    expect(screen.getByRole('button', { name: STAMP_OF_THE_REFUSAL })).toBeVisible();
    expect(screen.getByRole('button', { name: STAMP_OF_THE_SILENCE })).toBeVisible();
    expect(screen.getByRole('button', { name: STAMP_OF_THE_WRONG_ADDRESS })).toBeVisible();
    expect(packetTags()).toEqual(TAGS_OF_THE_FOUR_TESTS);
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

  it('the still drawing of a translated packet shows the label of the leg where the packet stands', async () => {
    const user = userEvent.setup();
    renderIncident('02-08');
    await drawWithoutAnimations(user);
    const terminal = await openTheTerminal(user);
    await sendMessage(user, terminal, NC_TO_THE_WEB_PORT);
    await confirm(user, terminal);
    expect(terminal).not.toBeInTheDocument();
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
    await confirm(user, await placeRule(user, SG_SERVIDOR1));
    await finish(RIGHT_ANSWER);
    expect(screen.getByRole('link', { name: NEXT_INCIDENT })).toHaveAttribute('href', '#/level/04-02');
    first.unmount();
    renderIncident('04-02');
    expect(screen.getByLabelText(SCREEN_TEXT.motion)).toBeChecked();
    expect(screen.getAllByRole('listitem').find((task) => task.textContent?.includes(PING_TASK))).toHaveTextContent(LUCIA_TEXT.pending);
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    const card = screen.getByRole('dialog', { name: SG_SERVIDOR2 });
    await user.click(within(card).getByRole('button', { name: REPLY_RULE }));
    await user.click(within(card).getByRole('button', { name: ECHO_REQUEST }));
    await user.click(within(card).getByRole('button', { name: SG_SERVIDOR1 }));
    await confirm(user, card);
    await finish(OPENING_RULE_ANSWER);
    expect(consoleErrors).not.toHaveBeenCalled();
  });

  it('an intrusion shows its alert inside the label of the device', async () => {
    const user = userEvent.setup();
    renderIncident(FIRST.id);
    await drawWithoutAnimations(user);
    const card = await placeRule(user, ANYWHERE);
    await confirm(user, card);
    expect(screen.getByRole('button', { name: ATTACKED_SERVER })).toBeVisible();
  });

  it('focus goes to the card heading when a Security Group opens, and back to it on Escape', async () => {
    const user = userEvent.setup();
    renderIncident(FIRST.id);
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR2 }));
    const card = screen.getByRole('dialog', { name: SG_SERVIDOR2 });
    expect(within(card).getByRole('heading', { level: 2 })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(card).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: SG_SERVIDOR2 })).toHaveFocus();
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
    expect(card).not.toBeInTheDocument();
    expect(consoleErrors).not.toHaveBeenCalled();
  });
});
