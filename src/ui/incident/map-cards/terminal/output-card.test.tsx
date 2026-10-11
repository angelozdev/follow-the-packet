// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TERMINAL_TEXT } from '@/copy';
import { sessionReducer, startSession, terminalCard, terminalLine, toolOutput, tracerouteLines, type ToolOutput } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { namesSendIncident, routedSendIncident } from '@/testing/incidents';
import { OutputCard, type Printed } from './output-card';
import { TerminalCard } from './terminal-card';

const NAMES = namesSendIncident();
const GROUP = TERMINAL_TEXT.output.label;
const sentOnce = (to: string, message: string) => sessionReducer(startSession([NAMES], NAMES.id), { type: 'sendPacket', fromId: 'you', toId: to, messageId: message });

function outputFor(to: string, message: string): ToolOutput {
  const output = toolOutput(sentOnce(to, message), { from: 'you', to, message });
  if (!output) throw new Error(`nothing printed for ${message} ${to}`);
  return output;
}

function Harness({ printed }: { printed: Printed }) {
  const [unfolded, setUnfolded] = useState(false);
  return <OutputCard printed={printed} unfolded={unfolded} onToggle={() => setUnfolded(!unfolded)} />;
}

const tool = (output: ToolOutput): Printed => ({ kind: 'tool', tool: output });
const linesOf = (group: HTMLElement) => [...group.querySelectorAll('code')].map((line) => line.textContent);
const everyLine = (output: ToolOutput) => output.segments.flatMap((segment) => (segment.kind === 'line' ? [segment.text] : segment.lines));

describe('output card of a dig', () => {
  const dig = outputFor('www', 'dig');
  const [status, , record] = dig.segments.flatMap((segment) => (segment.kind === 'line' ? [segment.text] : []));

  it('shows only its status line and its answer when folded, each in its place between the marks', () => {
    render(<Harness printed={tool(dig)} />);
    const group = screen.getByRole('group', { name: GROUP.dig });
    expect(linesOf(group)).toEqual([status, ';; ANSWER SECTION:', record]);
    expect([...group.children].map((child) => child.textContent)).toEqual([TERMINAL_TEXT.output.folded(4), status, TERMINAL_TEXT.output.folded(7), ';; ANSWER SECTION:', record, TERMINAL_TEXT.output.folded(6)]);
  });

  it('marks the key lines apart from the rest', () => {
    render(<Harness printed={tool(dig)} />);
    const keyLines = within(screen.getByRole('group', { name: GROUP.dig })).getAllByText((_, element) => element?.classList.contains('output__line--key') ?? false);
    expect(keyLines.map((line) => line.textContent)).toEqual([status, ';; ANSWER SECTION:', record]);
  });

  it('the control says how many lines are hidden and unfolds them in place', async () => {
    const user = userEvent.setup();
    render(<Harness printed={tool(dig)} />);
    const control = screen.getByRole('button', { name: TERMINAL_TEXT.output.show(17) });
    expect(control).toHaveAttribute('aria-expanded', 'false');
    await user.click(control);
    const group = screen.getByRole('group', { name: GROUP.dig });
    expect(linesOf(group)).toEqual(everyLine(dig));
    expect(linesOf(group).indexOf(status)).toBe(4);
    expect(group).not.toHaveTextContent('plegadas');
    const hide = screen.getByRole('button', { name: TERMINAL_TEXT.output.hide(17) });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    await user.click(hide);
    expect(linesOf(screen.getByRole('group', { name: GROUP.dig }))).toEqual([status, ';; ANSWER SECTION:', record]);
  });

  it('the folded lines are printed, not dropped: they are in the card whether it is folded or not', async () => {
    const user = userEvent.setup();
    render(<Harness printed={tool(dig)} />);
    const group = screen.getByRole('group', { name: GROUP.dig });
    expect(group).toHaveTextContent(`${TERMINAL_TEXT.output.folded(4)}${status}`);
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.output.show(17) }));
    expect(group.textContent).toContain('; <<>> DiG 9.18.50 <<>> www.lucia.example');
    expect(group.textContent).toContain(';; MSG SIZE  rcvd: 62');
  });

  it('keeps the tabs of the lines, which are how dig aligns the columns of a record', () => {
    render(<Harness printed={tool(dig)} />);
    expect(linesOf(screen.getByRole('group', { name: GROUP.dig }))[2]).toBe('www.lucia.example.\t300\tIN\tA\t198.51.100.50');
  });

  it('says that the id, the time, the date and the size are examples', () => {
    render(<Harness printed={tool(dig)} />);
    expect(screen.getByText(TERMINAL_TEXT.output.notes.dig)).toBeInTheDocument();
  });

  it('an output with no answer is not folded: it has no control', () => {
    const base = startSession([NAMES], NAMES.id);
    const unanswered = { ...base, world: { ...base.world, devices: base.world.devices.map((device) => (device.id === 'your-laptop' ? { ...device, dnsServer: '198.51.100.50' } : device)) } };
    const refused = sessionReducer(unanswered, { type: 'sendPacket', fromId: 'you', toId: 'www', messageId: 'dig' });
    const output = toolOutput(refused, { from: 'you', to: 'www', message: 'dig' });
    if (!output) throw new Error('a refused dig printed nothing');
    render(<Harness printed={tool(output)} />);
    expect(linesOf(screen.getByRole('group', { name: GROUP.dig }))).toEqual(everyLine(output));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('output card of an nc and of a traceroute', () => {
  it('the output of nc is not folded: its lines are written as ncat prints them and it has no control', () => {
    const nc = outputFor('lucia', 'nc');
    render(<Harness printed={tool(nc)} />);
    expect(linesOf(screen.getByRole('group', { name: GROUP.nc }))).toEqual(['Ncat: Version 7.93 ( https://nmap.org/ncat )', 'Ncat: Connection refused.']);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('a traceroute keeps its numbered list, its notes and the label it had', () => {
    const ROUTED = routedSendIncident();
    const session = sessionReducer(startSession([ROUTED], ROUTED.id), { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'trace' });
    const route = tracerouteLines(session, { from: 'you', to: 'server', message: 'trace' });
    if (!route) throw new Error('the traceroute printed nothing');
    render(<OutputCard printed={{ kind: 'route', route }} unfolded={false} onToggle={() => {}} />);
    const list = screen.getByRole('list', { name: TERMINAL_TEXT.route.label });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(within(list).getAllByRole('listitem')[0].querySelector('code')?.textContent).toBe(TERMINAL_TEXT.route.hop(1, '192.168.1.1'));
    expect(screen.getByText(TERMINAL_TEXT.route.notes.times)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('terminal card with the output of a dig', () => {
  function Terminal() {
    const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([NAMES], NAMES.id));
    const card = terminalCard(session, PIECE_ID.device('your-laptop'));
    if (!card) throw new Error('missing terminal');
    const onSend = ({ from, to, message }: { from: string; to: string; message: string }) => dispatch({ type: 'sendPacket', fromId: from, toId: to, messageId: message });
    return <TerminalCard card={card} describe={(picks) => terminalLine(session, picks)} route={() => null} printed={(picks) => toolOutput(session, picks)} onPickOrigin={vi.fn()} onSend={onSend} onClose={vi.fn()} />;
  }

  const send = async (user: ReturnType<typeof userEvent.setup>, address: string, message: string) => {
    await user.click(screen.getByRole('button', { name: address }));
    await user.click(screen.getByRole('button', { name: message }));
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
  };

  it('prints a dig under its command, folded, and folds it again when another chip is picked', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    await send(user, 'www.lucia.example', 'dig');
    expect(screen.getByRole('dialog').querySelector('code')).toHaveTextContent('dig www.lucia.example');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.output.show(17) }));
    expect(linesOf(screen.getByRole('group', { name: GROUP.dig }))).toHaveLength(20);
    await user.click(screen.getByRole('button', { name: 'nadie.lucia.example' }));
    await user.click(screen.getByRole('button', { name: 'dig' }));
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.output.show(19) })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(TERMINAL_TEXT.output.notes.dig)).toBeInTheDocument();
  });

  it('prints an nc under its command and no dig output', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    await send(user, '192.168.1.11', 'nc · puerto 3000');
    expect(screen.getByRole('dialog').querySelector('code')).toHaveTextContent('nc -vz -w 3 192.168.1.11 3000');
    expect(linesOf(screen.getByRole('group', { name: GROUP.nc }))).toEqual(['Ncat: Version 7.93 ( https://nmap.org/ncat )', 'Ncat: Connection refused.']);
    expect(screen.queryByRole('group', { name: GROUP.dig })).not.toBeInTheDocument();
  });
});
