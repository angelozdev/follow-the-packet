// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, toPlainText } from '@/copy';
import { firewallCard, sessionReducer, startSession, type Session } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { INCIDENTS, type FilterIncident } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { allOut } from '@/testing/fixtures';
import { filterIncident, hostFirewallIncident, outboundFilterIncident } from '@/testing/incidents';
import { TaskCard } from './task-card';

const SG_SERVIDOR2 = 'Security Group servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const DAY_SHIFT_ROW = 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)';

function renderIncidentCard(incident: FilterIncident, session: Session, firewallId: string) {
  const card = firewallCard(session, PIECE_ID.firewall(firewallId));
  if (!card) throw new Error(`missing firewall ${firewallId}`);
  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  render(<TaskCard card={card} chips={incident.chips} {...handlers} />);
  return handlers;
}

function renderCard(incidentId: string, firewallId: string = SG.servidor2) {
  return renderIncidentCard(filterIncident(incidentId), startSession(INCIDENTS, incidentId), firewallId);
}

describe('task card', () => {
  it('opens with the focus on its title and says when the Security Group has no inbound rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules['security-group']));
  });

  it('names the slot of a Security Group after its inbound rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.slot['security-group'] })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Regla de entrada nueva' })).toBeInTheDocument();
  });

  it('a host firewall says it has no rules and names its slot without the later inbound rules', () => {
    const host = hostFirewallIncident();
    renderIncidentCard(host, startSession([host], host.id), 'fw-lucia');
    expect(screen.getByRole('heading', { name: 'firewall laptop-lucia' })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: 'firewall laptop-lucia' })).toHaveTextContent('Este firewall no tiene reglas.');
    expect(screen.getByRole('group', { name: 'Regla nueva' })).toBeInTheDocument();
    expect(screen.queryByText(/de entrada/)).toBeNull();
  });

  it('names its trays Type and Source, like the inbound rules of the console', () => {
    renderCard('04-01');
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.what })).toHaveTextContent(ECHO_REQUEST);
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.from })).toHaveTextContent(SG_SERVIDOR1);
  });

  it('builds a rule with clicks: one chip from each tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(onPlace).toHaveBeenCalledWith(WHAT.echoRequest.id, FROM.sgServidor1.id);
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
  });

  it('builds a rule with the keyboard', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.tab();
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: SG_SERVIDOR1 })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledWith(WHAT.echoRequest.id, FROM.sgServidor1.id);
  });

  it('a chip clicked in the slot goes back to its tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('gives a chip back from the slot with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes a rule with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard('04-02');
    await user.tab();
    const removeButton = screen.getByRole('button', { name: TASK_CARD_TEXT.remove(DAY_SHIFT_ROW) });
    expect(removeButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledWith(DAY_SHIFT_RULE.id);
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
  });

  it('Esc and "Listo" close it', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('task card with the tabs of both directions', () => {
  const OUTBOUND = outboundFilterIncident();
  const FIREWALL = PIECE_ID.firewall('fw-you');
  const ECHO_ID = 'echo-request';
  const START = startSession([OUTBOUND], OUTBOUND.id);
  const OUTBOUND_RULE_ID = 'echo-request-to-to-lucia';
  const DESTINATION = TASK_CARD_TEXT.to;
  const SOURCE = TASK_CARD_TEXT.from;
  const ENTRADA = 'entrada';
  const SALIDA = 'salida';
  const LUCIA = 'lucia-laptop';
  const CLOSED_SENTENCE = 'Este firewall tiene la salida cerrada: alguien lo configuró así.';

  function renderFirewall(session: Session = START) {
    const card = firewallCard(session, FIREWALL);
    if (!card) throw new Error('missing the firewall of your laptop');
    const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn(), outbound: { onPlace: vi.fn(), onRemove: vi.fn() } };
    render(<TaskCard card={card} chips={OUTBOUND.chips} {...handlers} />);
    return handlers;
  }

  const tab = (name: string) => screen.getByRole('tab', { name });
  const pick = async (user: ReturnType<typeof userEvent.setup>, name: string) => user.click(within(screen.getByRole('tabpanel')).getByRole('button', { name }));

  it('shows the tabs Entrada and Salida and places a rule in the tab selected', async () => {
    const user = userEvent.setup();
    const { onPlace, outbound } = renderFirewall();
    expect(within(screen.getByRole('tablist', { name: TASK_CARD_TEXT.tabsName })).getAllByRole('tab').map((item) => item.textContent)).toEqual([ENTRADA, SALIDA]);
    await pick(user, ECHO_REQUEST);
    await pick(user, LUCIA);
    expect(onPlace).toHaveBeenCalledTimes(1);
    expect(onPlace).toHaveBeenCalledWith(ECHO_ID, 'from-lucia');
    expect(outbound.onPlace).not.toHaveBeenCalled();
    await user.click(tab(SALIDA));
    expect(screen.getByRole('group', { name: DESTINATION })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: SOURCE })).toBeNull();
    await pick(user, ECHO_REQUEST);
    await pick(user, LUCIA);
    expect(outbound.onPlace).toHaveBeenCalledTimes(1);
    expect(outbound.onPlace).toHaveBeenCalledWith(ECHO_ID, 'to-lucia');
    expect(onPlace).toHaveBeenCalledTimes(1);
  });

  it('starts on the Entrada tab', () => {
    renderFirewall();
    expect(tab(ENTRADA)).toHaveAttribute('aria-selected', 'true');
    expect(tab(SALIDA)).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: ENTRADA })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: SOURCE })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: DESTINATION })).toBeNull();
    expect(screen.getByRole('group', { name: 'Regla nueva' })).toBeInTheDocument();
  });

  it('shows no tabs while the firewall has no outbound rules open', () => {
    const closed = startSession([{ ...OUTBOUND, introduces: OUTBOUND.introduces.filter((term) => term !== 'outbound') }], OUTBOUND.id);
    expect(closed.parts.outboundRules['host-firewall']).toBe(false);
    renderFirewall(closed);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.getByRole('group', { name: SOURCE })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: DESTINATION })).toBeNull();
  });

  it('switching tabs keeps what was picked in the other tab', async () => {
    const user = userEvent.setup();
    const { onPlace, outbound } = renderFirewall();
    await pick(user, ECHO_REQUEST);
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'true');
    await user.click(tab(SALIDA));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    await pick(user, LUCIA);
    expect(screen.getByRole('button', { name: LUCIA })).toHaveAttribute('aria-pressed', 'true');
    await user.click(tab(ENTRADA));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: LUCIA })).toHaveAttribute('aria-pressed', 'false');
    await user.click(tab(SALIDA));
    expect(screen.getByRole('button', { name: LUCIA })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    expect(onPlace).not.toHaveBeenCalled();
    expect(outbound.onPlace).not.toHaveBeenCalled();
  });

  it('says in the Salida tab that the outbound side was closed by whoever configured it', async () => {
    const user = userEvent.setup();
    renderFirewall();
    await user.click(tab(SALIDA));
    expect(screen.getByRole('tabpanel', { name: SALIDA })).toHaveTextContent(CLOSED_SENTENCE);
    expect(screen.getByRole('group', { name: 'Regla nueva' })).toBeInTheDocument();
  });

  it('lists the outbound rules in the Salida tab and removes one with its own handler', async () => {
    const user = userEvent.setup();
    const placed = sessionReducer(START, { type: 'placeRule', firewallId: 'fw-you', whatId: ECHO_ID, toId: 'to-lucia', direction: 'outbound' });
    const { onRemove, outbound } = renderFirewall(placed);
    expect(within(screen.getByRole('tabpanel')).queryByRole('list')).toBeNull();
    await user.click(tab(SALIDA));
    expect(screen.getByRole('tabpanel', { name: SALIDA })).not.toHaveTextContent(CLOSED_SENTENCE);
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} → ${LUCIA}`) }));
    expect(outbound.onRemove).toHaveBeenCalledWith(OUTBOUND_RULE_ID);
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'firewall tu-laptop' })).toHaveFocus();
  });

  it('lists in the Salida tab, and lets the player remove, the outbound rule that lets everything out and that no destination chip names', async () => {
    const user = userEvent.setup();
    const { base } = OUTBOUND;
    if (!base) throw new Error('the incident has a base world');
    const open = { ...OUTBOUND, base: { ...base, firewalls: base.firewalls.map((firewall) => ({ ...firewall, outbound: [allOut('open-out')] })) } };
    const { outbound } = renderFirewall(startSession([open], open.id));
    await user.click(tab(SALIDA));
    expect(screen.getByRole('tabpanel', { name: SALIDA })).toHaveTextContent('deja salir todo el tráfico');
    expect(screen.getByRole('tabpanel', { name: SALIDA })).not.toHaveTextContent(CLOSED_SENTENCE);
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.remove('deja salir todo el tráfico') }));
    expect(outbound.onRemove).toHaveBeenCalledWith('open-out');
  });

  it('moves between the tabs with the arrow keys and keeps the focus in the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderFirewall();
    await user.tab();
    expect(tab(ENTRADA)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab(SALIDA)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('group', { name: DESTINATION })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
