// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useReducer, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PIECE_TEXT, TASK_CARD_TEXT, toPlainText } from '@/copy';
import { PANEL_TABS, inspect, pieceViews, sessionReducer, startSession, type Session } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { INCIDENTS, type Incident } from '@/levels';
import { OFFICE_FLOORS } from '@/testing/fixtures';
import { classifyIncident, identifyIncident, namesSendIncident, outboundFilterIncident, sendIncident } from '@/testing/incidents';
import { webSendIncident } from '@/testing/web/web-incident';
import { ShellPanel } from './shell-panel';

const NAMES = namesSendIncident();
const LAPTOP = PIECE_ID.device('your-laptop');
const ROUTER = PIECE_ID.router(OFFICE_FLOORS.officeRouter.id);
const PROVIDER = PIECE_ID.router(OFFICE_FLOORS.provider.id);
const MAIN_TABS = { name: PIECE_TEXT.tabsName };
const WWW = 'www.lucia.example';

function Hosted({ incident, first, session: given }: { incident?: Incident; first: string; session?: Session }) {
  const [started, dispatch] = useReducer(sessionReducer, undefined, () => given ?? startSession([incident as Incident], (incident as Incident).id));
  const [chosen, choose] = useState<string | null>(first);
  return (
    <>
      {[LAPTOP, ROUTER, PROVIDER, PIECE_ID.device('printer'), PIECE_ID.device('lucia-laptop')].map((piece) => (
        <button key={piece} type="button" onClick={() => choose(piece)}>
          {`go to ${piece}`}
        </button>
      ))}
      <button type="button" onClick={() => choose(null)}>
        away
      </button>
      <ShellPanel session={started} dispatch={dispatch} inspection={chosen === null ? null : inspect(started, chosen)} pieceId={chosen} heading={createRef()} onClose={() => choose(null)} onChoose={choose} />
    </>
  );
}

const mainTabs = () => within(screen.getByRole('tablist', MAIN_TABS)).getAllByRole('tab').map((tab) => tab.textContent);
const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
const go = (user: ReturnType<typeof userEvent.setup>, piece: string) => user.click(screen.getByRole('button', { name: `go to ${piece}` }));

describe('the panel of a piece', () => {
  it('the panel of a piece shows its tabs in the fixed order and draws none the piece lacks', () => {
    const { unmount } = render(<Hosted incident={NAMES} first={LAPTOP} />);
    expect(mainTabs()).toEqual(['Estado', 'Ajustes', 'Tablas', 'Terminal']);
    unmount();
    const alone = render(<Hosted incident={sendIncident()} first={PIECE_ID.device('printer')} />);
    expect(mainTabs()).toEqual(['Estado']);
    alone.unmount();
    render(<Hosted incident={webSendIncident()} first={LAPTOP} />);
    expect(mainTabs()).toEqual(['Estado', 'Ajustes', 'Tablas', 'Terminal', 'Navegador']);
    expect(PANEL_TABS).toEqual(['status', 'settings', 'tables', 'terminal', 'browser', 'questions']);
  });

  it('every piece of every registered incident draws a panel whose tabs follow the fixed order', { timeout: 120_000 }, async () => {
    const user = userEvent.setup({ delay: null });
    const wrong: string[] = [];
    const order = ['Estado', 'Ajustes', 'Tablas', 'Terminal', 'Navegador', 'Preguntas'];
    for (const incident of INCIDENTS) {
      const session = startSession(INCIDENTS, incident.id);
      for (const { id } of pieceViews(session)) {
        const view = render(<Hosted first={id} session={session} />);
        const names = mainTabs();
        const positions = names.map((name) => order.indexOf(name ?? ''));
        if (names[0] !== 'Estado' || positions.some((at, index) => at < 0 || (index > 0 && at <= positions[index - 1]))) wrong.push(`${incident.id} ${id}: ${names.join(' ')}`);
        for (const tab of within(screen.getByRole('tablist', MAIN_TABS)).getAllByRole('tab')) {
          await user.click(tab);
          for (const ficha of screen.queryAllByRole('tablist').filter((list) => list.getAttribute('aria-label') !== PIECE_TEXT.tabsName).flatMap((list) => within(list).getAllByRole('tab'))) await user.click(ficha);
          if (screen.getAllByRole('tabpanel').length === 0) wrong.push(`${incident.id} ${id} ${tab.textContent}: nothing is drawn`);
        }
        view.unmount();
      }
    }
    expect(wrong).toEqual([]);
  });

  it('the network settings and the services are drawn as sections of Ajustes, one under the other', async () => {
    const user = userEvent.setup();
    const [, listen] = NAMES.send.settings!;
    const both = { ...NAMES, send: { ...NAMES.send, settings: [...NAMES.send.settings!, { ...listen, id: 'own-app', deviceId: 'your-laptop' }] } };
    render(<Hosted incident={both} first={LAPTOP} />);
    await user.click(screen.getByRole('tab', { name: 'Ajustes' }));
    const panel = screen.getByRole('tabpanel', { name: 'Ajustes' });
    expect(within(panel).queryByRole('tablist'), 'sections are not tabs').toBeNull();
    const headings = within(panel).getAllByRole('heading', { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(['Ajustes de red', 'Servicios']);
    expect(headings[0].compareDocumentPosition(headings[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the tables of a piece are drawn as fichas of Tablas, and a piece with one table has no ficha', async () => {
    const user = userEvent.setup();
    render(<Hosted incident={NAMES} first={ROUTER} />);
    const fichas = screen.getByRole('tablist', { name: 'Tablas' });
    expect(within(fichas).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Tabla de rutas', 'Tabla de traducciones']);
    await user.click(within(fichas).getByRole('tab', { name: 'Tabla de traducciones' }));
    expect(screen.getByRole('table', { name: 'Tabla de traducciones de router-office' })).toBeInTheDocument();
    await go(user, PROVIDER);
    expect(screen.queryByRole('tablist', { name: 'Tablas' }), 'a piece with one table has no ficha').toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Tabla de rutas' })).toBeInTheDocument();
  });

  it('the rules of a firewall are drawn in Tablas with the two tabs of direction', () => {
    const outbound = outboundFilterIncident();
    render(<Hosted incident={outbound} first={PIECE_ID.firewall('fw-you')} />);
    expect(mainTabs()).toEqual(['Estado', 'Tablas']);
    expect(screen.getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('tablist', { name: TASK_CARD_TEXT.tabsName })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['entrada', 'salida']);
  });

  it('a locked piece is selected and its panel has only Estado', () => {
    const session = startSession(INCIDENTS, '04-01');
    const locked = pieceViews(session).find((piece) => piece.locked);
    if (!locked) throw new Error('04-01 has no locked piece');
    render(<Hosted first={locked.id} session={session} />);
    expect(mainTabs()).toEqual(['Estado']);
    expect(screen.getByRole('region', { name: toPlainText(inspect(session, locked.id)?.title ?? '') })).toBeInTheDocument();
  });

  it('once the incident is over the panel of a piece has only Estado', () => {
    const playing = startSession([NAMES], NAMES.id);
    for (const phase of ['explaining', 'result'] as const) {
      const view = render(<Hosted first={LAPTOP} session={{ ...playing, phase }} />);
      expect(mainTabs(), phase).toEqual(['Estado']);
      expect(screen.getByRole('tab', { name: 'Estado' })).toHaveAttribute('aria-selected', 'true');
      view.unmount();
    }
  });

  it('the panel opens on the tab the card used to open and on Estado when the piece has no other', async () => {
    const user = userEvent.setup();
    render(<Hosted incident={NAMES} first={LAPTOP} />);
    expect(screen.getByRole('tab', { name: 'Ajustes' }), 'the incident opens the laptop on its settings').toHaveAttribute('aria-selected', 'true');
    await go(user, ROUTER);
    expect(screen.getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
    await go(user, PIECE_ID.device('printer'));
    expect(mainTabs()).toEqual(['Estado']);
    expect(screen.getByRole('tab', { name: 'Estado' })).toHaveAttribute('aria-selected', 'true');
  });

  it('the tab chosen on a piece stays when the player selects another piece and comes back', async () => {
    const user = userEvent.setup();
    render(<Hosted incident={NAMES} first={LAPTOP} />);
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    await go(user, ROUTER);
    await user.click(screen.getByRole('tab', { name: 'Estado' }));
    await go(user, LAPTOP);
    expect(screen.getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
    await go(user, ROUTER);
    expect(screen.getByRole('tab', { name: 'Estado' })).toHaveAttribute('aria-selected', 'true');
  });

  it('what the player half did in a terminal, a table or a question survives a change of tab and of piece', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Hosted incident={NAMES} first={LAPTOP} />);
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    await user.click(screen.getByRole('button', { name: WWW }));
    await user.click(screen.getByRole('tab', { name: 'Ajustes' }));
    expect(screen.queryByRole('button', { name: WWW }), 'the terminal is not drawn on another tab').toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    expect(pressed(WWW), 'the chip of the terminal stays after a change of tab').toBe('true');
    await go(user, PROVIDER);
    await user.click(screen.getByRole('button', { name: 'default' }));
    await go(user, LAPTOP);
    expect(pressed(WWW), 'and after a change of piece').toBe('true');
    await go(user, PROVIDER);
    expect(pressed('default'), 'the chip of the table stays after a change of piece').toBe('true');
    unmount();

    const identifying = identifyIncident();
    const printer = PIECE_ID.device('printer');
    render(<Hosted incident={identifying} first={printer} />);
    await user.click(screen.getByRole('button', { name: '192.168.1.21' }));
    await user.click(screen.getByRole('button', { name: 'away' }));
    expect(screen.queryByRole('region')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'go to device:printer' }));
    expect(pressed('192.168.1.21'), 'the pick of the question stays, unconfirmed').toBe('true');
  });

  it('the questions and the classification of a device are fichas of Preguntas, and a device with one of them has no ficha', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Hosted incident={classifyIncident()} first={LAPTOP} />);
    expect(mainTabs()).toEqual(['Estado', 'Preguntas']);
    const fichas = screen.getByRole('tablist', { name: 'Preguntas' });
    expect(within(fichas).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Responder', 'Clasificar']);
    await user.click(within(fichas).getByRole('tab', { name: 'Clasificar' }));
    await user.click(screen.getByRole('button', { name: /^impresora/ }));
    await user.click(within(fichas).getByRole('tab', { name: 'Responder' }));
    await user.click(within(fichas).getByRole('tab', { name: 'Clasificar' }));
    expect(screen.getByRole('button', { name: /^impresora/ })).toHaveAttribute('aria-pressed', 'true');
    unmount();
    render(<Hosted incident={identifyIncident()} first={PIECE_ID.device('printer')} />);
    expect(screen.queryByRole('tablist', { name: 'Preguntas' })).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Responder' })).toBeInTheDocument();
  });

  it('Escape closes nothing in the panel and the tab bar names itself', async () => {
    const user = userEvent.setup();
    const closed = vi.fn();
    const session = startSession([NAMES], NAMES.id);
    render(<ShellPanel session={session} dispatch={vi.fn()} inspection={inspect(session, LAPTOP)} pieceId={LAPTOP} heading={createRef()} onClose={closed} onChoose={vi.fn()} />);
    await user.keyboard('{Escape}');
    expect(closed).not.toHaveBeenCalled();
    expect(screen.getByRole('tablist', MAIN_TABS)).toBeInTheDocument();
  });
});
