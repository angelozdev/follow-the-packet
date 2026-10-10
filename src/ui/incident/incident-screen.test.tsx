// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CASE_TEXT, EXPLANATION_TEXT, LUCIA_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, TERMS, toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { NOTE_RULE, diagnoseIncident, filterIncident, gatewayIncident, identifyIncident, sendIncident } from '@/testing/incidents';
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
    expect(box).not.toHaveTextContent('IP pública');
    expect(box).not.toHaveTextContent('34.244.254.100');
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
  const GATEWAY = gatewayIncident();
  const SETTINGS = 'Ajustes de red de tu-laptop';
  const ENTRY = 'Ajustes de red tu-laptop';
  const ROUTER = '192.168.1.1';
  const LOST_PING = 'ping de tu-laptop a 192.168.2.15';
  const PING_ANDRES = 'ping de tu-laptop a laptop-andres';

  function renderGateway() {
    render(<IncidentScreen incidents={[GATEWAY]} incidentId={GATEWAY.id} nextId={null} onFinish={vi.fn()} />);
  }

  async function sendToAndres(user: User) {
    const terminal = screen.getByRole('dialog', { name: /^Terminal de/ });
    await user.click(within(terminal).getByRole('button', { name: '192.168.2.15' }));
    await user.click(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send }));
  }

  it('the laptop opens its terminal from its piece and its settings card from its own entry, and the terminal offers no setting', async () => {
    const user = userEvent.setup();
    renderGateway();
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    const terminal = screen.getByRole('dialog', { name: 'Terminal de tu-laptop' });
    expect(within(terminal).queryByRole('group', { name: TERMS['default-gateway'].name })).toBeNull();
    expect(within(terminal).queryByRole('button', { name: ROUTER })).toBeNull();
    await user.click(screen.getByRole('button', { name: ENTRY }));
    expect(screen.queryByRole('dialog', { name: 'Terminal de tu-laptop' })).toBeNull();
    const card = screen.getByRole('dialog', { name: SETTINGS });
    expect(within(card).getByRole('group', { name: TERMS['default-gateway'].name })).toBeInTheDocument();
  });

  it('setting the gateway on the card makes the ping come back and clears the stamps of before, and Esc gives the focus back to the entry', async () => {
    const user = userEvent.setup();
    renderGateway();
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await sendToAndres(user);
    expect(screen.getByRole('button', { name: LOST_PING })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: ENTRY }));
    await user.click(within(screen.getByRole('dialog', { name: SETTINGS })).getByRole('button', { name: ROUTER }));
    expect(screen.queryByRole('button', { name: LOST_PING })).toBeNull();
    expect(screen.getByRole('button', { name: ROUTER })).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: ENTRY })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    await sendToAndres(user);
    await user.click(screen.getByRole('button', { name: PING_ANDRES }));
    expect(screen.getByRole('region', { name: PING_ANDRES })).toHaveTextContent('Llegó y volvió la respuesta.');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(LUCIA_TEXT.done);
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
