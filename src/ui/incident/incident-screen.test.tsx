// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, ROADMAP_TEXT, TASK_CARD_TEXT } from '@/copy';
import { STABLE_MS } from '@/game';
import { INCIDENTS } from '@/levels';
import type { GameSceneProps } from '@/scene';
import { IncidentScreen } from './incident-screen';
import { TICK_MS } from './use-stability-clock';

vi.mock('@/scene/game-scene', async () => {
  const { PieceLabel } = await vi.importActual<typeof import('@/scene/overlay/piece-label')>('@/scene/overlay/piece-label');
  const { toPlainText } = await vi.importActual<typeof import('@/copy')>('@/copy');
  return {
    GameScene: ({ pieces, flows, overlay, onInspect, onActivate }: GameSceneProps) => (
      <div>
        {pieces.map((piece) => (
          <PieceLabel key={piece.id} piece={piece} onInspect={onInspect} onActivate={onActivate} />
        ))}
        {flows.map((flow) => (
          <button key={flow.id} type="button" onFocus={() => onInspect(flow.pieceId)}>
            {toPlainText(flow.label)}
          </button>
        ))}
        {overlay}
      </div>
    ),
  };
});

const DOOR = 'Security Group servidor2';
const OTHER_DOOR = 'Security Group servidor1';
const LOCKED_SERVER = 'servidor2 con candado';
const ATTACKER_PACKET = 'ping de Atacante a servidor2';
const FULL_STARS = 3;
const FIRST = INCIDENTS[0];
const RIGHT_ANSWER = /no había ninguna para el ping de servidor1/;
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';

type User = ReturnType<typeof userEvent.setup>;

function renderFirst() {
  const onFinish = vi.fn();
  render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST.id} nextId={INCIDENTS[1].id} onFinish={onFinish} />);
  return onFinish;
}

async function placeFix(user: User) {
  await user.click(screen.getByRole('button', { name: DOOR }));
  const card = screen.getByRole('dialog', { name: DOOR });
  await user.click(within(card).getByRole('button', { name: ECHO_REQUEST }));
  await user.click(within(card).getByRole('button', { name: SG_SERVIDOR1 }));
  return card;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('incident screen', () => {
  it('opens the card from its door, and Esc closes it and gives the focus back to the door', async () => {
    const user = userEvent.setup();
    renderFirst();
    const door = screen.getByRole('button', { name: DOOR });
    await user.click(door);
    expect(screen.getByRole('dialog', { name: DOOR })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(door).toHaveFocus();
  });

  it('a rule placed from the card shows up in it', async () => {
    const user = userEvent.setup();
    renderFirst();
    const card = await placeFix(user);
    expect(within(card).getByRole('button', { name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} ← ${SG_SERVIDOR1}`) })).toBeInTheDocument();
  });

  it('switching to another door opens its card with an empty slot', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: DOOR }));
    await user.click(within(screen.getByRole('dialog', { name: DOOR })).getByRole('button', { name: ECHO_REQUEST }));
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

  it('the inspection box leaves out fields whose term comes later', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: LOCKED_SERVER }));
    const box = screen.getByRole('region', { name: 'servidor2' });
    expect(box).toHaveTextContent('IP privada');
    expect(box).toHaveTextContent('172.31.38.97');
    expect(box).not.toHaveTextContent('IP pública');
    expect(box).not.toHaveTextContent('34.244.254.100');
  });

  it('a packet says where and why it stopped', async () => {
    const user = userEvent.setup();
    renderFirst();
    await user.click(screen.getByRole('button', { name: ATTACKER_PACKET }));
    expect(screen.getByRole('region', { name: ATTACKER_PACKET })).toHaveTextContent('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
  });

  it('closing with the card open moves the focus to Lucía’s question, and the right answer gives 3 stars', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onFinish = renderFirst();
    await placeFix(user);
    await act(async () => {
      vi.advanceTimersByTime(STABLE_MS + TICK_MS);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: EXPLANATION_TEXT.asks })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: RIGHT_ANSWER }));
    await user.click(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult }));
    expect(onFinish).toHaveBeenCalledWith(FULL_STARS);
    expect(screen.getByText(ROADMAP_TEXT.starsOf(FULL_STARS))).toBeInTheDocument();
  });
});
