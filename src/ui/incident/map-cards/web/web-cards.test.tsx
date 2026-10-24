// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BROWSER_TEXT, SITES_TEXT, TERMINAL_TEXT } from '@/copy';
import { pieceCard, pieceViews, sessionReducer, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { OFFICE_FLOORS } from '@/testing/fixtures';
import { webSendIncident } from '@/testing/web/web-incident';
import { PieceCard, pieceHandlers } from '@/ui/incident/map-cards/piece-card';

const WEB = webSendIncident();
const LAPTOP = PIECE_ID.device('your-laptop');
const SERVER = PIECE_ID.actor(OFFICE_FLOORS.server.id);
const BROWSER_TAB = 'Navegador';
const BROWSER_CARD = 'Navegador de tu-laptop';
const SITES_CARD = 'Sitios de servidor-internet';
const SHOP_URL = 'http://www.lucia.example/';
const BLOG_URL = 'http://blog.lucia.example/';
const ORDERS_BY_IP = 'http://192.168.1.11:3000/pedidos';
const LOOPBACK = 'http://localhost:3000/pedidos?id=7';
const BLOG_NAME = 'blog.lucia.example';
const SHOP_NAME = 'www.lucia.example';
const SERVES_THE_BLOG = 'El blog';
const SERVES_THE_SHOP = 'La tienda';

function Hosted({ pieceId = LAPTOP }: { pieceId?: string }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([WEB], WEB.id));
  const card = pieceCard(session, pieceId);
  if (!card) throw new Error('missing the card of the piece');
  return <PieceCard card={card} {...pieceHandlers(session, dispatch, vi.fn())} onClose={vi.fn()} />;
}

const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
const seen = () => screen.getByRole('group', { name: BROWSER_TEXT.sees });

async function openTheBrowser(address: string) {
  const user = userEvent.setup();
  render(<Hosted />);
  await user.click(screen.getByRole('tab', { name: BROWSER_TAB }));
  await user.click(screen.getByRole('button', { name: address }));
  await user.click(screen.getByRole('button', { name: BROWSER_TEXT.open }));
  return user;
}

describe('the tab of the browser', () => {
  it('the browser is a tab of the card of tu-laptop and not a piece of the map', async () => {
    const user = userEvent.setup();
    const session = startSession([WEB], WEB.id);
    expect(pieceCard(session, LAPTOP)?.tabs.map((tab) => tab.id)).toContain('browser');
    expect(pieceViews(session).filter((piece) => /browser/i.test(`${piece.id} ${piece.anchorId} ${piece.variant}`))).toEqual([]);
    render(<Hosted />);
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toContain(BROWSER_TAB);
    await user.click(screen.getByRole('tab', { name: BROWSER_TAB }));
    expect(screen.getByRole('dialog', { name: BROWSER_CARD })).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: BROWSER_TEXT.open })).toBeDisabled();
  });

  it('opens an address and draws the page the server sent as the text of the card', async () => {
    await openTheBrowser(SHOP_URL);
    expect(seen()).toHaveTextContent(SHOP_URL);
    expect(seen()).toHaveTextContent(SERVES_THE_SHOP);
  });

  it('a browser error is drawn outside Message', async () => {
    await openTheBrowser(ORDERS_BY_IP);
    expect(seen()).toHaveTextContent(BROWSER_TEXT.noConnection);
    expect(seen().closest('.message')).toBeNull();
    expect(document.querySelector('.message')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('switching tabs keeps the address picked', async () => {
    const user = await openTheBrowser(SHOP_URL);
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    expect(screen.queryByRole('button', { name: BROWSER_TEXT.open })).toBeNull();
    await user.click(screen.getByRole('tab', { name: BROWSER_TAB }));
    expect(pressed(SHOP_URL)).toBe('true');
    expect(seen()).toHaveTextContent(SERVES_THE_SHOP);
  });

  it('the tab is reached and used with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Hosted />);
    screen.getByRole('tab', { name: 'Terminal' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: BROWSER_TAB })).toHaveAttribute('aria-selected', 'true');
    await user.tab();
    expect(screen.getByRole('tabpanel')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: LOOPBACK })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(pressed(LOOPBACK)).toBe('true');
    for (let chip = 1; chip < WEB.send.to.length; chip += 1) {
      await user.tab();
      expect(document.activeElement).toHaveClass('chip');
    }
    await user.tab();
    expect(screen.getByRole('button', { name: BROWSER_TEXT.open })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(seen()).toHaveTextContent(BROWSER_TEXT.refused);
  });
});

describe('the sites card of a web server', () => {
  const add = () => screen.getByRole('button', { name: SITES_TEXT.add });
  const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

  it('a piece with a single card draws no tab bar', () => {
    expect(pieceCard(startSession([WEB], WEB.id), SERVER)?.tabbed).toBe(false);
    render(<Hosted pieceId={SERVER} />);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('dialog', { name: SITES_CARD })).toBeInTheDocument();
  });

  it('placing a site needs both trays and then places it', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={SERVER} />);
    expect(rows()).toHaveLength(1);
    expect(add()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: BLOG_NAME }));
    expect(add()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: SERVES_THE_BLOG }));
    expect(add()).toBeEnabled();
    await user.click(add());
    expect(rows()).toHaveLength(2);
    expect(rows()[1]).toHaveTextContent(`${BLOG_NAME}${SERVES_THE_BLOG}`);
    expect(pressed(BLOG_NAME)).toBe('false');
    expect(add()).toBeDisabled();
    expect(screen.getByRole('heading', { name: SITES_CARD })).toHaveFocus();
  });

  it('a rejected site shows its problem as an error message under the table, in a status region that was already there', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={SERVER} />);
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: SHOP_NAME }));
    await user.click(screen.getByRole('button', { name: SERVES_THE_BLOG }));
    await user.click(add());
    const problem = within(screen.getByRole('status')).getByText(/Ese nombre ya tiene un sitio/);
    expect(screen.getByRole('status')).toBe(region);
    expect(problem.closest('.message')).toHaveClass('message--error');
    expect(screen.getByRole('table').compareDocumentPosition(region)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(rows()).toHaveLength(1);
  });
});

describe('the output of a curl', () => {
  const curlBlocks = () => screen.queryAllByRole('group', { name: new RegExp(`^${TERMINAL_TEXT.output.label.curl}`) });
  const titled = (number: number) => TERMINAL_TEXT.output.titled(TERMINAL_TEXT.output.label.curl, TERMINAL_TEXT.output.sendTitle(number));

  async function pickTheCurlTo(url: string) {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: url }));
    await user.click(screen.getByRole('button', { name: /^curl$/ }));
    return user;
  }

  it('the output repeats its block for each send of the same chips, titled Envío 1 and Envío 2', async () => {
    render(<Hosted />);
    const user = await pickTheCurlTo(SHOP_URL);
    const send = screen.getByRole('button', { name: TERMINAL_TEXT.send });
    expect(curlBlocks()).toHaveLength(0);
    await user.click(send);
    expect(curlBlocks().map((block) => block.getAttribute('aria-label'))).toEqual([titled(1)]);
    await user.click(send);
    expect(curlBlocks().map((block) => block.getAttribute('aria-label'))).toEqual([titled(1), titled(2)]);
    expect(screen.getByText(TERMINAL_TEXT.output.sendTitle(1))).toBeInTheDocument();
    expect(screen.getByText(TERMINAL_TEXT.output.sendTitle(2))).toBeInTheDocument();
    for (const block of curlBlocks()) expect(block).toHaveTextContent(SERVES_THE_SHOP);
  });

  it('a send of other chips starts its own list of blocks', async () => {
    render(<Hosted />);
    const user = await pickTheCurlTo(SHOP_URL);
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    await user.click(screen.getByRole('button', { name: BLOG_URL }));
    expect(curlBlocks()).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(curlBlocks().map((block) => block.getAttribute('aria-label'))).toEqual([titled(1)]);
  });
});
