import { endpointName, type TermText } from '@/copy';
import { caseClosed, currentCase, type Session } from '@/game/session';
import { firstTry } from '@/game/stars';
import { terminalLine } from './terminal-card';

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

export interface CaseCard {
  number: number;
  total: number;
  report: TermText;
  origins: CaseOrigin[];
  question: TermText;
  options: CaseOption[];
  closed: boolean;
  last: boolean;
}

function causeState(session: Session, index: number): CauseState {
  if (!session.named.includes(index)) return 'untried';
  return currentCase(session)?.cause.options[index].correct ? 'right' : 'wrong';
}

/** Returns what the card of the case a diagnose is on shows: its number, its report, the tests each origin can send (with the line the terminal prints and whether the player sent it), its cause question and options in the order of the case, and for each option whether the player named it and, if so, its feedback. Null when the incident is not a diagnose. */
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
