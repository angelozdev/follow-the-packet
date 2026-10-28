import type { Dispatch } from 'react';
import { isShellCommand, terminalLine, toolOutputs, tracerouteLines, browserView, type SendPicks, type Session, type SessionAction } from '@/game';
import type { RuleHandlers } from '@/ui/incident/map-cards/task-card';
import type { TableHandlers } from '@/ui/incident/map-cards/table-card';
import type { TerminalHandlers } from '@/ui/incident/map-cards/terminal/terminal-card';
import type { BrowserHandlers } from '@/ui/incident/map-cards/web/browser-card';

type Picks = Record<string, string>;

/** What the cards in the panel of a piece ask of their screen. */
export interface PanelHandlers extends TableHandlers {
  terminal: TerminalHandlers;
  browser: BrowserHandlers;
  rules: (firewallId: string) => RuleHandlers;
  onAnswer: (deviceId: string, picks: Picks) => void;
  onPick: (deviceId: string, settingId: string, chipId: string) => void;
}

/** Wires what the cards in the panel ask to the session: what the terminal prints is read from it, and each move the player makes is an action of its reducer. `onPickOrigin` is how the screen moves the panel to the piece of another origin. */
export function panelHandlers(session: Session, dispatch: Dispatch<SessionAction>, onPickOrigin: (fromId: string) => void): PanelHandlers {
  const send = ({ from, to, message }: SendPicks) => dispatch({ type: 'sendPacket', fromId: from, toId: to, messageId: message });
  return {
    terminal: {
      describe: (picks) => terminalLine(session, picks),
      shell: (picks) => isShellCommand(session, picks),
      route: (picks) => tracerouteLines(session, picks),
      printed: (picks) => toolOutputs(session, picks),
      onPickOrigin,
      onSend: send,
    },
    browser: { view: (picks) => browserView(session, picks), onOpen: send, onSignIn: send },
    rules: (firewallId) => ({
      onPlace: (whatId, fromId) => dispatch({ type: 'placeRule', firewallId, whatId, fromId }),
      onRemove: (ruleId) => dispatch({ type: 'removeRule', firewallId, ruleId }),
      outbound: {
        onPlace: (whatId, toId) => dispatch({ type: 'placeRule', firewallId, whatId, toId, direction: 'outbound' }),
        onRemove: (ruleId) => dispatch({ type: 'removeRule', firewallId, ruleId, direction: 'outbound' }),
      },
    }),
    onAnswer: (deviceId, picks) => dispatch({ type: 'answerCard', deviceId, picks }),
    onPick: (deviceId, settingId, chipId) => dispatch({ type: 'setSetting', deviceId, settingId, chipId }),
    onPlace: (tableId, picks) => dispatch({ type: 'placeEntry', tableId, picks }),
    onRemove: (tableId, entryId) => dispatch({ type: 'removeEntry', tableId, entryId }),
  };
}
