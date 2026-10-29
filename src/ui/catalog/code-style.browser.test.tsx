import { render } from '@testing-library/react';
import { createRef, useReducer } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { INTERFACE_TEXT, TERMINAL_TEXT, WEB_BOX_TEXT } from '@/copy';
import { tokenPx } from '@/design';
import { PIECE_ID, inspect, panelOf, sessionReducer, startSession, toolOutputOf } from '@/game';
import { sendIncident } from '@/testing/incidents';
import { moveTheMouseAway } from '@/testing/browser-play';
import { tokenColor } from '@/testing/token-color';
import { webSendIncident } from '@/testing/web/web-incident';
import { InspectionBox } from '@/ui/incident/inspection-box';
import { frameOfPart } from '@/ui/shell/panel/frame-of-part';
import { panelHandlers } from '@/ui/shell/panel/panel-handlers';
import { PiecePanel } from '@/ui/shell/panel/piece-panel';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';
import { usePanelChoice } from '@/ui/shell/panel/use-panel-choice';
import { usePanelDrafts } from '@/ui/shell/panel/use-panel-drafts';
import { TaggedText } from '@/ui/tagged-text';
import { InterfaceSection } from './interface-section';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE = { width: 360, height: 800 };
const PROMPT = '"$ "';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const NO_BREAK_SPACE = '\u00a0';
const HANGING_INDENT_CHARACTERS = 2;
const SHOP_URL = 'http://www.lucia.example/pedidos-de-octubre?id=7';
const BEFORE_THE_PATH = 'http://www.lucia.example/';
const AFTER_THE_PATH = 'pedidos-de-octubre?id=7';
const LONG_WORD = 'una-clave-demasiado-larga-para-caber-en-una-fila-de-360-px';
const LONG_HEADER = 'Content-Type: text/plain; charset=utf-8; boundary=una-frontera-larga';
const CODE_IP = '192.168.1.20';
const PROSE_IP = '198.51.100.60';
const IP_TEXT = `La app recibió 20 peticiones de ${PROSE_IP} y ${CODE_IP}:3000 contestó.`;
const SHOP_BOX = 'sent-you-shop-curl';
const BOX_MARGIN_PX = 16;
const RESPONSE_NOTE = WEB_BOX_TEXT.notes.response;
const SENDING = sendIncident();
const WEB = webSendIncident();
const SESSION = startSession([WEB], WEB.id);
const LAPTOP = PIECE_ID.device('your-laptop');
const nothing = () => undefined;
const LONG_OUTPUT = toolOutputOf(
  'curl',
  [LONG_HEADER, '', LONG_WORD].map((text) => ({ text, key: false })),
  [],
  TERMINAL_TEXT.output.sendTitle(1),
);

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

async function drawTheInterface(): Promise<HTMLElement> {
  render(<InterfaceSection />);
  const region = page.getByRole('region', { name: INTERFACE_TEXT.title });
  await expect.element(region).toBeVisible();
  return region.element() as HTMLElement;
}

const inside = (root: Element, selector: string) => [...root.querySelectorAll<HTMLElement>(selector)];

function theOne(root: Element, selector: string): HTMLElement {
  const found = inside(root, selector);
  expect(found, `«${selector}» matches exactly one element`).toHaveLength(1);
  return found[0];
}

function lengthOf(length: string, like: Element): number {
  const probe = document.createElement('span');
  probe.style.cssText = `position: absolute; visibility: hidden; width: ${length}; font: ${getComputedStyle(like).font}`;
  document.body.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();
  return width;
}

describe('the command and the output of a terminal as code', () => {
  it('the command and each output block sit on a dark panel with paper text', async () => {
    const region = await drawTheInterface();
    const panels = inside(region, '.command, .output:not(.output--message)');
    expect(panels, 'the terminal specimen, the output specimen and its output block').toHaveLength(3);
    for (const panel of panels) {
      const style = getComputedStyle(panel);
      expect(style.backgroundColor, panel.className).toBe(tokenColor('--color-ink'));
      expect(style.color, panel.className).toBe(tokenColor('--color-on-fill'));
      expect(Number.parseFloat(style.borderTopLeftRadius), panel.className).toBe(tokenPx('--radius'));
    }
    const lines = inside(region, '.command code, .output:not(.output--message) .output__line:not(.output__line--key)');
    expect(lines, 'the two commands: the folded output has only key lines').toHaveLength(2);
    for (const line of lines) {
      const style = getComputedStyle(line);
      expect(style.color, line.textContent ?? '').toBe(tokenColor('--color-on-fill'));
      expect(style.fontFamily, 'the mono face').toContain('monospace');
      expect(style.fontSize).toBe('13px');
      const indent = lengthOf(`${HANGING_INDENT_CHARACTERS}ch`, line);
      expect(Number.parseFloat(style.textIndent), 'a line that wraps hangs 2 characters').toBeCloseTo(-indent, 1);
      expect(Number.parseFloat(style.paddingLeft) - indent, 'the first line starts at the padding of the panel').toBeCloseTo(lengthOf('var(--space-sm)', line), 1);
    }
  });

  it('the prompt of the command is drawn, cannot be selected and is not in the text that is copied', async () => {
    const region = await drawTheInterface();
    const commands = inside(region, '.command code');
    expect(commands).toHaveLength(2);
    for (const command of commands) {
      const prompt = getComputedStyle(command, '::before');
      expect(prompt.content, 'the prompt is drawn by the stylesheet').toBe(PROMPT);
      expect(prompt.userSelect, 'the prompt cannot be selected').toBe('none');
      expect(prompt.color).toBe(tokenColor('--color-shade'));
      expect(command.textContent, 'the prompt is not text of the page').not.toContain('$');
      const selection = getSelection();
      selection?.selectAllChildren(command);
      expect(selection?.toString(), 'what is copied is the command alone').toBe(command.textContent);
      selection?.removeAllRanges();
    }
  });

  it('the key line of a dig is inverted on the dark panel and keeps its contrast', async () => {
    const region = await drawTheInterface();
    const output = theOne(region, '.output:not(.output--message)');
    const keyLines = inside(output, '.output__line--key');
    expect(keyLines).toHaveLength(3);
    for (const line of keyLines) {
      const style = getComputedStyle(line);
      expect(style.backgroundColor, line.textContent ?? '').toBe(tokenColor('--color-surface'));
      expect(style.color).toBe(tokenColor('--color-ink'));
    }
    for (const line of inside(output, '.output__line:not(.output__line--key)')) expect(getComputedStyle(line).backgroundColor).toBe(TRANSPARENT);
    const folds = inside(output, '.output__fold');
    expect(folds).toHaveLength(3);
    for (const fold of folds) {
      const style = getComputedStyle(fold);
      expect(style.borderTopStyle).toBe('dotted');
      expect(style.borderTopColor, 'the dotted rule is a paper tone').toBe(tokenColor('--color-shade'));
      expect(style.borderBottomColor).toBe(tokenColor('--color-shade'));
      expect(style.color, 'so is the mark').toBe(tokenColor('--color-shade'));
    }
  });
});

describe('the prompt of the command', () => {
  function Terminal() {
    const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([SENDING], SENDING.id));
    return <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, LAPTOP)} pieceId={LAPTOP} heading={createRef()} onClose={nothing} onChoose={nothing} />;
  }

  it('a hand-made packet line of chapter 1 keeps the dark panel and has no prompt, and a shell command has it', async () => {
    const view = render(<Terminal />);
    const terminal = page.getByRole('region', { name: 'your-laptop', exact: true });
    await userEvent.click(terminal.getByRole('button', { name: '192.168.1.11', exact: true }));
    await userEvent.click(terminal.getByRole('button', { name: 'Echo Reply', exact: true }));
    await moveTheMouseAway();
    const handMade = theOne(view.container, '.command');
    expect(handMade.textContent, 'the line of a packet made by hand').toBe('paquete armado a mano: Echo Reply → 192.168.1.11');
    expect(getComputedStyle(handMade).backgroundColor, 'it keeps the dark panel').toBe(tokenColor('--color-ink'));
    expect(getComputedStyle(theOne(handMade, 'code'), '::before').content, 'and has no prompt').toBe('none');
    await userEvent.click(terminal.getByRole('button', { name: '192.168.1.20', exact: true }));
    await userEvent.click(terminal.getByRole('button', { name: 'ping', exact: true }));
    const command = theOne(view.container, '.command');
    expect(command.textContent).toBe('ping 192.168.1.20');
    expect(getComputedStyle(theOne(command, 'code'), '::before').content, 'a shell command has its prompt').toBe(PROMPT);
  });
});

describe('the message of the box and the prose as code', () => {
  it('a message of the box sits on the light panel with a thin border', async () => {
    const region = await drawTheInterface();
    const message = theOne(region, '.output--message');
    const style = getComputedStyle(message);
    expect(style.backgroundColor).toBe(tokenColor('--color-shade'));
    expect(style.color).toBe(tokenColor('--color-ink'));
    expect(style.borderTopWidth).toBe(`${tokenPx('--stroke-thin')}px`);
    expect(style.borderTopStyle).toBe('solid');
    expect(style.borderTopColor).toBe(tokenColor('--color-ink-soft'));
    expect(Number.parseFloat(style.borderTopLeftRadius)).toBe(tokenPx('--radius'));
    const lines = inside(message, '.output__line');
    expect(lines.map((line) => line.textContent)).toEqual(INTERFACE_TEXT.sample.message.lines);
    for (const line of lines) {
      expect(getComputedStyle(line).fontFamily, 'the mono face').toContain('monospace');
      expect(getComputedStyle(line).color).toBe(tokenColor('--color-ink'));
    }
    expect(lines.indexOf(lines.find((line) => line.textContent === '') as HTMLElement), 'the blank line stands before the body').toBe(lines.length - 2);
    expect(message.closest('dd')?.nextElementSibling?.textContent, 'the note stays under the panel, in the body font').toBe(RESPONSE_NOTE);
  });

  it('an IP in a text is drawn in the mono face with no box and reads the same', async () => {
    const view = render(
      <p>
        <TaggedText text={IP_TEXT} />
      </p>,
    );
    const paragraph = theOne(view.container, 'p');
    expect(paragraph.textContent, 'the text reads the same').toBe(IP_TEXT);
    const ips = inside(paragraph, '.ip-text');
    expect(ips.map((ip) => ip.textContent)).toEqual([PROSE_IP, `${CODE_IP}:3000`]);
    for (const ip of ips) {
      const style = getComputedStyle(ip);
      expect(style.fontFamily, 'the mono face').toContain('monospace');
      expect(style.fontFamily).not.toBe(getComputedStyle(paragraph).fontFamily);
      expect(style.backgroundColor, 'no fill').toBe(TRANSPARENT);
      expect(`${style.borderTopWidth} ${style.paddingLeft}`, 'no border and no padding').toBe('0px 0px');
    }
    view.rerender(
      <button type="button">
        <TaggedText text={IP_TEXT} />
      </button>,
    );
    await expect.element(page.getByRole('button', { name: IP_TEXT, exact: true })).toBeVisible();
  });
});

describe('at 360 px', () => {
  function Terminal({ line }: { line: string }) {
    const drafts = usePanelDrafts();
    const choice = usePanelChoice();
    const handlers = { ...panelHandlers(SESSION, nothing, nothing), terminal: { describe: () => line, route: () => null, printed: () => LONG_OUTPUT, onPickOrigin: nothing, onSend: nothing } };
    const inspection = inspect(SESSION, LAPTOP);
    if (!inspection) throw new Error('missing the inspection of the laptop');
    return (
      <aside className="incident__panel">
        <PiecePanel panel={panelOf(SESSION, LAPTOP)} inspection={inspection} heading={createRef()} choice={choice} frameOf={(part) => frameOfPart(part, { handlers, drafts, onClose: nothing, refocus: nothing })} />
      </aside>
    );
  }

  function Box() {
    const sent = sessionReducer(SESSION, { type: 'sendPacket', fromId: 'you', toId: 'shop', messageId: 'curl' });
    const inspection = inspect(sent, PIECE_ID.packet(SHOP_BOX));
    if (!inspection) throw new Error('missing box');
    return (
      <div style={{ width: `${PHONE.width - 2 * BOX_MARGIN_PX}px` }}>
        <InspectionBox inspection={inspection} pinned={false} heading={createRef()} onClose={() => undefined} />
      </div>
    );
  }

  const rowsOf = (command: Element, text: string): DOMRect[] => {
    const walker = document.createTreeWalker(command, NodeFilter.SHOW_TEXT);
    const written = text.replaceAll(' ', NO_BREAK_SPACE);
    for (let node = walker.nextNode() as Text | null; node !== null; node = walker.nextNode() as Text | null) {
      const at = node.data.indexOf(written);
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + written.length);
      return [...range.getClientRects()];
    }
    throw new Error(`the command has no text «${text}»`);
  };

  it('at 360 px the command, the output and the message of the box do not scroll sideways and a long url breaks at its points', async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const view = render(<Terminal line={TERMINAL_TEXT.curl(SHOP_URL, { include: true })} />);
    const command = theOne(view.container, '.command code');
    const [curl, before, after] = [rowsOf(command, 'curl -i'), rowsOf(command, BEFORE_THE_PATH), rowsOf(command, AFTER_THE_PATH)];
    for (const group of [curl, before, after]) expect(group, 'no group breaks inside').toHaveLength(1);
    expect(before[0].top, 'the url starts a row: the break before http://').toBeGreaterThan(curl[0].top);
    expect(after[0].top, 'and breaks again after the last slash of its path').toBeGreaterThan(before[0].top);
    expect(after[0].left, 'the last row hangs under the first character of the command').toBeCloseTo(before[0].left, 0);
    view.rerender(<Terminal line={TERMINAL_TEXT.curl(SHOP_URL, { include: true, data: LONG_WORD })} />);
    expect(rowsOf(command, `-d ${LONG_WORD}`).length, 'a word longer than the row breaks, as the last resort').toBeGreaterThan(1);
    const body = theOne(view.container, '.chip-card__body');
    expect(document.documentElement.scrollWidth, 'the page does not scroll sideways').toBeLessThanOrEqual(PHONE.width);
    expect(body.scrollWidth, 'the body of the card does not scroll sideways').toBeLessThanOrEqual(body.clientWidth);
    for (const panel of inside(view.container, '.command, .output, .command code, .output__line')) expect(panel.scrollWidth, panel.className).toBeLessThanOrEqual(panel.clientWidth);
    view.unmount();
    const box = render(<Box />);
    const message = inside(box.container, '.output--message');
    expect(message.map((panel) => panel.closest('dd')?.parentElement?.querySelector('dt')?.textContent), 'the request and the response of the box').toEqual(['Petición HTTP', 'Respuesta HTTP']);
    const fields = theOne(box.container, '.inspection__fields');
    expect(fields.scrollWidth, 'the fields of the box do not scroll sideways').toBeLessThanOrEqual(fields.clientWidth);
    for (const panel of inside(box.container, '.output--message, .output--message .output__line')) expect(panel.scrollWidth, panel.className).toBeLessThanOrEqual(panel.clientWidth);
    const rows = inside(box.container, '.output--message .output__line');
    expect(Math.max(...rows.map((line) => line.getBoundingClientRect().height)), 'a long header wraps into more rows').toBeGreaterThan(Number.parseFloat(getComputedStyle(rows[0]).lineHeight));
  });
});
