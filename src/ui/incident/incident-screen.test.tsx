// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, LUCIA_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, TERMS, toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { filterIncident, sendIncident } from '@/testing/incidents';
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
