// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type Dispatch } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, toPlainText } from '@/copy';
import { inspect, sessionReducer, startSession, type Session, type SessionAction } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { allOut } from '@/testing/fixtures';
import { hostFirewallIncident, outboundFilterIncident } from '@/testing/incidents';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const SG_SERVIDOR2 = 'Security Group servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const DAY_SHIFT_ROW = 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)';

const panelFor = (session: Session, pieceId: string, dispatch: Dispatch<SessionAction> = vi.fn(), onClose = vi.fn()) => <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, pieceId)} pieceId={pieceId} heading={createRef()} onClose={onClose} onChoose={vi.fn()} />;

function renderRules(session: Session, firewallId: string) {
  const spies = { dispatch: vi.fn(), onClose: vi.fn() };
  render(panelFor(session, PIECE_ID.firewall(firewallId), spies.dispatch, spies.onClose));
  return spies;
}

function renderCard(incidentId: string, firewallId: string = SG.servidor2) {
  return renderRules(startSession(INCIDENTS, incidentId), firewallId);
}

const placed = (firewallId: string, whatId: string, peerId: string) => ({ type: 'placeRule', firewallId, whatId, fromId: peerId });

describe('task card', () => {
  it('opens in Tablas under the name of the firewall and says when the Security Group has no inbound rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('region', { name: SG_SERVIDOR2 })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules['security-group']));
  });

  it('names the slot of a Security Group after its inbound rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.slot['security-group'] })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Regla de entrada nueva' })).toBeInTheDocument();
  });

  it('a host firewall says it has no rules and names its slot without the later inbound rules', () => {
    const host = hostFirewallIncident();
    renderRules(startSession([host], host.id), 'fw-lucia');
    expect(screen.getByRole('region', { name: 'firewall laptop-lucia' })).toHaveTextContent('Este firewall no tiene reglas.');
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
    const { dispatch } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(dispatch).toHaveBeenCalledWith(placed(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
  });

  it('builds a rule with the keyboard', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderCard('04-01');
    screen.getByRole('button', { name: ECHO_REQUEST }).focus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: SG_SERVIDOR1 })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(dispatch).toHaveBeenCalledWith(placed(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id));
  });

  it('a chip clicked in the slot goes back to its tray', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('gives a chip back from the slot with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    screen.getByRole('button', { name: ECHO_REQUEST }).focus();
    await user.keyboard('{Enter}');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes a rule with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderCard('04-02');
    const removeButton = screen.getByRole('button', { name: TASK_CARD_TEXT.remove(DAY_SHIFT_ROW) });
    removeButton.focus();
    await user.keyboard('{Enter}');
    expect(dispatch).toHaveBeenCalledWith({ type: 'removeRule', firewallId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id });
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
  });

  it('Esc closes nothing and the rules have no "Listo"', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: TASK_CARD_TEXT.done })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('task card with the tabs of both directions', () => {
  const OUTBOUND = outboundFilterIncident();
  const ECHO_ID = 'echo-request';
  const START = startSession([OUTBOUND], OUTBOUND.id);
  const OUTBOUND_RULE_ID = 'echo-request-to-to-lucia';
  const DESTINATION = TASK_CARD_TEXT.to;
  const SOURCE = TASK_CARD_TEXT.from;
  const ENTRADA = 'entrada';
  const SALIDA = 'salida';
  const LUCIA = 'lucia-laptop';
  const CLOSED_SENTENCE = 'Este firewall tiene la salida cerrada: alguien lo configuró así.';

  const renderFirewall = (session: Session = START) => renderRules(session, 'fw-you');
  const direction = () => screen.getByRole('tablist', { name: TASK_CARD_TEXT.tabsName });
  const tab = (name: string) => within(direction()).getByRole('tab', { name });
  const pick = async (user: ReturnType<typeof userEvent.setup>, name: string) => user.click(within(screen.getAllByRole('tabpanel').at(-1) as HTMLElement).getByRole('button', { name }));
  const outboundPlaced = (whatId: string, toId: string) => ({ type: 'placeRule', firewallId: 'fw-you', whatId, toId, direction: 'outbound' });

  it('shows the tabs Entrada and Salida and places a rule in the tab selected', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderFirewall();
    expect(within(direction()).getAllByRole('tab').map((item) => item.textContent)).toEqual([ENTRADA, SALIDA]);
    await pick(user, ECHO_REQUEST);
    await pick(user, LUCIA);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(placed('fw-you', ECHO_ID, 'from-lucia'));
    await user.click(tab(SALIDA));
    expect(screen.getByRole('group', { name: DESTINATION })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: SOURCE })).toBeNull();
    await pick(user, ECHO_REQUEST);
    await pick(user, LUCIA);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith(outboundPlaced(ECHO_ID, 'to-lucia'));
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
    expect(screen.queryByRole('tablist', { name: TASK_CARD_TEXT.tabsName })).toBeNull();
    expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual(['Estado', 'Tablas']);
    expect(screen.getByRole('group', { name: SOURCE })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: DESTINATION })).toBeNull();
  });

  it('switching tabs keeps what was picked in the other tab', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderFirewall();
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
    expect(dispatch).not.toHaveBeenCalled();
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
    const withRule = sessionReducer(START, { type: 'placeRule', firewallId: 'fw-you', whatId: ECHO_ID, toId: 'to-lucia', direction: 'outbound' });
    const { dispatch } = renderFirewall(withRule);
    expect(within(screen.getAllByRole('tabpanel').at(-1) as HTMLElement).queryByRole('list')).toBeNull();
    await user.click(tab(SALIDA));
    expect(screen.getByRole('tabpanel', { name: SALIDA })).not.toHaveTextContent(CLOSED_SENTENCE);
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.remove(`${ECHO_REQUEST} → ${LUCIA}`) }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'removeRule', firewallId: 'fw-you', ruleId: OUTBOUND_RULE_ID, direction: 'outbound' });
    expect(screen.getByRole('heading', { name: 'firewall tu-laptop' })).toHaveFocus();
  });

  it('lists in the Salida tab, and lets the player remove, the outbound rule that lets everything out and that no destination chip names', async () => {
    const user = userEvent.setup();
    const { base } = OUTBOUND;
    if (!base) throw new Error('the incident has a base world');
    const open = { ...OUTBOUND, base: { ...base, firewalls: base.firewalls.map((firewall) => ({ ...firewall, outbound: [allOut('open-out')] })) } };
    const { dispatch } = renderFirewall(startSession([open], open.id));
    await user.click(tab(SALIDA));
    expect(screen.getByRole('tabpanel', { name: SALIDA })).toHaveTextContent('deja salir todo el tráfico');
    expect(screen.getByRole('tabpanel', { name: SALIDA })).not.toHaveTextContent(CLOSED_SENTENCE);
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.remove('deja salir todo el tráfico') }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'removeRule', firewallId: 'fw-you', ruleId: 'open-out', direction: 'outbound' });
  });

  it('moves between the tabs with the arrow keys and keeps the focus in the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderFirewall();
    tab(ENTRADA).focus();
    await user.keyboard('{ArrowRight}');
    expect(tab(SALIDA)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('group', { name: DESTINATION })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('what was put in a slot and the direction chosen stay when the panel changes tab and comes back', async () => {
    const user = userEvent.setup();
    renderFirewall();
    await user.click(tab(SALIDA));
    await pick(user, ECHO_REQUEST);
    await user.click(screen.getByRole('tab', { name: 'Estado' }));
    expect(screen.queryByRole('tablist', { name: TASK_CARD_TEXT.tabsName })).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Tablas' }));
    expect(tab(SALIDA)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'true');
  });
});
