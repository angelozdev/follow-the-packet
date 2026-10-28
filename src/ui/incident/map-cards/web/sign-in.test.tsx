// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useReducer, type Dispatch } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BROWSER_TEXT } from '@/copy';
import { inspect, sessionReducer, startSession, type Session, type SessionAction } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { OFFICE_FLOORS } from '@/testing/fixtures';
import { signInIncident } from '@/testing/web/web-incident';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const SIGN_IN = signInIncident();
const LAPTOP = PIECE_ID.device('your-laptop');
const ADMIN_URL = `http://${OFFICE_FLOORS.floor1.lucia}:3000/admin`;
const LOGIN_URL = `http://${OFFICE_FLOORS.floor1.lucia}:3000/login`;
const SITE = OFFICE_FLOORS.floor1.lucia;

const panelFor = (session: Session, dispatch: Dispatch<SessionAction>) => <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, LAPTOP)} pieceId={LAPTOP} heading={createRef()} onClose={vi.fn()} onChoose={vi.fn()} />;

function Browser({ record }: { record: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([SIGN_IN], SIGN_IN.id));
  const recording: Dispatch<SessionAction> = (action) => {
    record.push(action);
    dispatch(action);
  };
  return panelFor(session, recording);
}

const press = (name: string) => screen.getByRole('button', { name });
const memory = () => screen.getByRole('group', { name: BROWSER_TEXT.memory.title });
const cookies = () => within(within(memory()).getByRole('table')).getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent));

async function reachTheBrowser() {
  const user = userEvent.setup();
  const actions: SessionAction[] = [];
  render(<Browser record={actions} />);
  await user.click(screen.getByRole('tab', { name: 'Navegador' }));
  return { user, actions };
}

async function signInAs(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(press(ADMIN_URL));
  await user.click(press(name));
  await user.click(press(BROWSER_TEXT.signIn));
}

describe('signing in from the tab of the browser', () => {
  it('signing in from the browser sends a post to the login and keeps the cookie', async () => {
    const { user, actions } = await reachTheBrowser();
    expect(press(BROWSER_TEXT.signIn)).toBeDisabled();
    await user.click(press(ADMIN_URL));
    expect(press(BROWSER_TEXT.signIn), 'a user is still missing').toBeDisabled();
    await user.click(press('Lucía'));
    expect(press(BROWSER_TEXT.signIn)).toBeEnabled();
    await user.click(press(BROWSER_TEXT.signIn));
    expect(actions).toEqual([{ type: 'sendPacket', fromId: 'you', toId: 'admin', messageId: 'sign-in-lucia' }]);
    const seen = screen.getByRole('group', { name: BROWSER_TEXT.sees });
    expect(seen).toHaveTextContent(LOGIN_URL);
    expect(seen).toHaveTextContent('Sesión iniciada.');
    expect(cookies()).toEqual([[SITE, 'sesion', 's1']]);
    await user.click(press(BROWSER_TEXT.open));
    expect(seen).toHaveTextContent('Panel de administración.');
  });

  it('the memory table lists the cookies the browser holds, by site', async () => {
    const { user } = await reachTheBrowser();
    expect(within(memory()).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(Object.values(BROWSER_TEXT.memory.columns));
    expect(within(memory()).getByRole('table')).toHaveTextContent(BROWSER_TEXT.memory.empty);
    await signInAs(user, 'Lucía');
    expect(cookies()).toEqual([[SITE, 'sesion', 's1']]);
    await user.click(press('Marta'));
    await user.click(press(BROWSER_TEXT.signIn));
    expect(cookies(), 'the same name and site replace each other').toEqual([[SITE, 'sesion', 's2']]);
    await user.click(press(BROWSER_TEXT.open));
    expect(screen.getByRole('group', { name: BROWSER_TEXT.sees })).toHaveTextContent('Ese usuario no tiene permiso para entrar aquí.');
  });

  it('a cookie row names the term cookie', async () => {
    const { user } = await reachTheBrowser();
    await signInAs(user, 'Lucía');
    const term = within(memory()).getByText('cookie');
    expect(term).toHaveClass('term');
    await user.hover(term);
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^cookie: .*Set-Cookie/);
  });

  it('switching tabs keeps the user picked', async () => {
    const { user } = await reachTheBrowser();
    await user.click(press('Marta'));
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    expect(screen.queryByRole('button', { name: BROWSER_TEXT.signIn })).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Navegador' }));
    expect(press('Marta')).toHaveAttribute('aria-pressed', 'true');
    expect(press('Lucía')).toHaveAttribute('aria-pressed', 'false');
  });

  it('a browser whose incident offers no sign-in has no user tray and no sign-in button', async () => {
    const user = userEvent.setup();
    const offering = { ...SIGN_IN, send: { ...SIGN_IN.send, message: SIGN_IN.send.message.filter(({ signIn }) => signIn === undefined) } };
    const Plain = () => {
      const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([offering], offering.id));
      return panelFor(session, dispatch);
    };
    render(<Plain />);
    await user.click(screen.getByRole('tab', { name: 'Navegador' }));
    expect(screen.queryByRole('group', { name: BROWSER_TEXT.user })).toBeNull();
    expect(screen.queryByRole('button', { name: BROWSER_TEXT.signIn })).toBeNull();
    expect(memory()).toBeInTheDocument();
  });
});
