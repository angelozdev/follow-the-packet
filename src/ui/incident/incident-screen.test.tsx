// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CASE_TEXT, EXPLANATION_TEXT, LUCIA_TEXT, OUTCOME_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, TERMS, toPlainText } from '@/copy';
import { INCIDENTS, type SendIncident } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { CHAPTER_1_TERMS, NOTE_RULE, diagnoseIncident, filterIncident, gatewayIncident, identifyIncident, namesSendIncident, sendIncident } from '@/testing/incidents';
import { IncidentScreen } from './incident-screen';

vi.mock('@/scene/game-scene', async () => {
  const { PieceLabel } = await vi.importActual<typeof import('@/scene/overlay/piece-label')>('@/scene/overlay/piece-label');
  const { toPlainText } = await vi.importActual<typeof import('@/copy')>('@/copy');
  return {
    GameScene: ({ pieces, flows, sent, overlay, onInspect, onActivate }: GameSceneProps) => (
      <div>
        {pieces.map((piece) => (
          <PieceLabel key={piece.id} piece={piece} onInspect={onInspect} onActivate={onActivate} />
        ))}
        {[...flows, ...sent].map((flow) => (
          <button key={flow.id} type="button" onFocus={() => onInspect(flow.pieceId)}>
            {toPlainText(flow.label)}
          </button>
        ))}
        {overlay}
      </div>
    ),
  };
});

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

type User = ReturnType<typeof userEvent.setup>;

function renderFirst() {
  const onFinish = vi.fn();
  render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId="04-02" onFinish={onFinish} />);
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
    renderFirst();
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
  afterEach(() => vi.useRealTimers());

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

  async function digTheName(user: User) {
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    const terminal = screen.getByRole('dialog', { name: 'Terminal de tu-laptop' });
    await user.click(within(terminal).getByRole('button', { name: WWW }));
    await user.click(within(terminal).getByRole('button', { name: 'dig' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  const clock = () => within(screen.getByRole('region', { name: CLOCK })).getByText(/min \d\d s$/);

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
