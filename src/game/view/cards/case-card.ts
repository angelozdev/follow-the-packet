import { endpointName, type TermText } from '@/copy';
import { caseClosed, currentCase, type Session } from '@/game/session';
import { firstTry } from '@/game/stars';
import { taskHolds } from '@/game/tasks';
import { PIECE_ID } from '@/game/view/piece-id';
import { terminalLine } from '@/game/view/cards/terminal/terminal-card';
import type { CaseSpec, TableSpec } from '@/levels';
import { recordsCard, routesCard } from './table-card';

export type CauseState = 'untried' | 'wrong' | 'right';

interface CaseTest {
  fromId: string;
  toId: string;
  messageId: string;
  line: TermText;
  sent: boolean;
}

interface CaseOrigin {
  fromId: string;
  name: TermText;
  tests: CaseTest[];
}

interface CaseOption {
  text: TermText;
  state: CauseState;
  feedback: TermText | null;
}

interface RepairTask {
  id: string;
  text: TermText;
  done: boolean;
}

interface RepairTable {
  pieceId: string;
  title: TermText;
}

/** What a case with a fix asks besides naming the cause: the tasks that must hold, each marked once it does, and the tables the player edits to make them hold, each with the piece that opens it and its title. */
export interface CaseRepair {
  tasks: RepairTask[];
  tables: RepairTable[];
}

export interface CaseCard {
  number: number;
  total: number;
  report: TermText;
  origins: CaseOrigin[];
  repair: CaseRepair | null;
  question: TermText;
  options: CaseOption[];
  closed: boolean;
  last: boolean;
}

function causeState(session: Session, index: number): CauseState {
  if (!session.named.includes(index)) return 'untried';
  return currentCase(session)?.cause.options[index].correct ? 'right' : 'wrong';
}

function repairTable(session: Session, table: TableSpec): RepairTable[] {
  const card = table.kind === 'routes' ? routesCard(session, PIECE_ID.router(table.ownerId)) : recordsCard(session, PIECE_ID.actor(table.ownerId));
  return card ? [{ pieceId: card.pieceId, title: card.title }] : [];
}

function repairOf(session: Session, fix: NonNullable<CaseSpec['fix']>): CaseRepair {
  return {
    tasks: fix.tasks.map((task) => ({ id: task.id, text: task.text, done: taskHolds(task, session.runs, session.sent) })),
    tables: fix.tables.flatMap((table) => repairTable(session, table)),
  };
}

/** Returns what the card of the case a diagnose is on shows: its number, its report, the tests each origin can send (with the line the terminal prints and whether the player sent it), what it asks besides the cause when the case has a fix (`repair`: its tasks, each ticked once it holds in the last packets sent, and the tables to edit with the piece that opens each, whose card is the one that piece opens), its cause question and options in the order of the case, and for each option whether the player named it and, if so, its feedback. The case is `closed` when the cause is right and, if it has a fix, the fix holds. Null when the incident is not a diagnose. */
export function caseCard(session: Session): CaseCard | null {
  const spec = currentCase(session);
  if (!spec || session.incident.mechanic !== 'diagnose') return null;
  const total = session.incident.diagnose.cases.length;
  return {
    number: session.caseIndex + 1,
    total,
    report: spec.report,
    origins: spec.send.from.map((origin) => ({
      fromId: origin.id,
      name: endpointName(origin.endpoint, session.world),
      tests: spec.send.to.flatMap((to) =>
        spec.send.message.flatMap((message) => {
          const line = terminalLine(session, { from: origin.id, to: to.id, message: message.id });
          const sent = session.sent.some((packet) => packet.fromId === origin.id && packet.toId === to.id && packet.messageId === message.id);
          return line ? [{ fromId: origin.id, toId: to.id, messageId: message.id, line, sent }] : [];
        }),
      ),
    })),
    repair: spec.fix ? repairOf(session, spec.fix) : null,
    question: spec.cause.question,
    options: spec.cause.options.map((option, index) => {
      const state = causeState(session, index);
      return { text: option.text, state, feedback: state === 'untried' ? null : option.feedback };
    }),
    closed: caseClosed(session),
    last: session.caseIndex === total - 1,
  };
}

export interface CaseSummary {
  total: number;
  missed: number[];
}

/** Returns how the cases of a diagnose went: how many there are and the numbers (from 1) of those whose right cause was not the first one named. Null when the incident is not a diagnose. */
export function caseSummary(session: Session): CaseSummary | null {
  const { incident } = session;
  if (incident.mechanic !== 'diagnose') return null;
  return { total: incident.diagnose.cases.length, missed: session.caseResults.flatMap((result, index) => (firstTry(result) ? [] : [index + 1])) };
}
