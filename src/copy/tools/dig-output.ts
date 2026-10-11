import { DNS_PORT, type AnswerRecord, type DnsStatus, type SoaRecord } from '@/engine';
import { replySize } from './dns-message-size';

const DIG_VERSION = '9.18.50';
const EXAMPLE_ID = 41237;
const EDNS_UDP_SIZE = 1232;
const ATTEMPTS = 3;
const BLANK = '';
const TTL_COLUMN = 24;
const CLASS_COLUMN = 32;
const TYPE_COLUMN = 40;
const RDATA_COLUMN = 48;
const TAB_WIDTH = 8;
const CLASS = 'IN';
const QUESTION_TYPE = 'A';
const REASON = { timeout: 'timed out', refused: 'connection refused' } as const;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WHEN_AT_START_MS = Date.UTC(2026, 9, 11, 10, 15, 0);
const MS_PER_SECOND = 1000;
const DATE_DIGITS = 2;

/** The answer of a resolver to a `dig`: the name asked as the player typed it, the status of the answer, its records in order with the TTL each has left, the SOA of the zone for a negative answer, the IP of the resolver, the round trip of the game and the second of the game clock the `dig` ran at. */
export interface DigReply {
  kind: 'reply';
  name: string;
  status: Exclude<DnsStatus, 'NO-RESOLVER'>;
  answers: AnswerRecord[];
  soa?: SoaRecord;
  server: string;
  queryMs: number;
  at: number;
}

/** A `dig` that got no answer: nobody answered within the wait (`timeout`) or the host at the resolver address rejected the datagram with Port Unreachable (`refused`). */
export interface DigFailure {
  kind: 'timeout' | 'refused';
  name: string;
  server: string;
}

export type DigResult = DigReply | DigFailure;

/** One line of the output of `dig`, as printed (the tabs included) and whether it is one of the key lines: the status of the answer and the answer itself, which the card keeps in view when it folds the rest. */
export interface DigLine {
  text: string;
  key: boolean;
}

interface Cell {
  text: string;
  column: number;
}

const plain = (text: string): DigLine => ({ text, key: false });
const key = (text: string): DigLine => ({ text, key: true });

/** Returns the spaces and tabs `indent` of `lib/dns/masterdump.c` writes to take a line from `column` to column `to`: at least one character, tabs of `TAB_WIDTH` while a tab stop lies ahead, then spaces. */
function gap(column: number, to: number): { text: string; column: number } {
  const target = Math.max(to, column + 1);
  const tabs = Math.floor(target / TAB_WIDTH) - Math.floor(column / TAB_WIDTH);
  const from = tabs > 0 ? Math.floor(target / TAB_WIDTH) * TAB_WIDTH : column;
  return { text: '\t'.repeat(Math.max(tabs, 0)) + ' '.repeat(target - from), column: target };
}

function inColumns([owner, ...cells]: [Cell, ...Cell[]]): string {
  return cells.reduce(
    (line, cell) => {
      const spacing = gap(line.column, cell.column);
      return { text: `${line.text}${spacing.text}${cell.text}`, column: spacing.column + cell.text.length };
    },
    { text: owner.text, column: owner.text.length },
  ).text;
}

function rdataText(record: AnswerRecord | SoaRecord): string {
  if (record.type === 'A') return record.value;
  if (record.type === 'CNAME') return `${record.value}.`;
  const { mname, rname, serial, refresh, retry, expire, minimum } = record.value;
  return `${mname}. ${rname}. ${serial} ${refresh} ${retry} ${expire} ${minimum}`;
}

function recordText(record: AnswerRecord | SoaRecord): string {
  return inColumns([
    { text: `${record.name}.`, column: 0 },
    { text: String(record.ttl), column: TTL_COLUMN },
    { text: CLASS, column: CLASS_COLUMN },
    { text: record.type, column: TYPE_COLUMN },
    { text: rdataText(record), column: RDATA_COLUMN },
  ]);
}

function questionText(name: string): string {
  return `;${inColumns([
    { text: `${name}.`, column: 0 },
    { text: CLASS, column: CLASS_COLUMN },
    { text: QUESTION_TYPE, column: TYPE_COLUMN },
  ])}`;
}

function twoDigits(value: number): string {
  return String(value).padStart(DATE_DIGITS, '0');
}

/** Returns the date of the `;; WHEN:` line in the `%a %b %d %H:%M:%S %Z %Y` format of `dig.c`, in UTC: the game has no wall clock, so it starts on a date of the game and moves on with the game clock. */
function whenText(clockSeconds: number): string {
  const date = new Date(WHEN_AT_START_MS + clockSeconds * MS_PER_SECOND);
  const day = `${WEEKDAYS[date.getUTCDay()]} ${MONTHS[date.getUTCMonth()]} ${twoDigits(date.getUTCDate())}`;
  const time = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()].map(twoDigits).join(':');
  return `${day} ${time} UTC ${date.getUTCFullYear()}`;
}

function greeting(name: string): string[] {
  return [BLANK, `; <<>> DiG ${DIG_VERSION} <<>> ${name}`, ';; global options: +cmd'];
}

function failureLines({ kind, name, server }: DigFailure): DigLine[] {
  const attempt = `;; communications error to ${server}#${DNS_PORT}: ${REASON[kind]}`;
  return [...Array.from({ length: ATTEMPTS }, () => attempt), ...greeting(name), ';; no servers could be reached'].map(plain);
}

function sectionLines(title: string, records: (AnswerRecord | SoaRecord)[], keep: boolean): DigLine[] {
  if (records.length === 0) return [];
  const mark = keep ? key : plain;
  return [mark(`;; ${title} SECTION:`), ...records.map((record) => mark(recordText(record))), plain(BLANK)];
}

function replyLines({ name, status, answers, soa, server, queryMs, at }: DigReply): DigLine[] {
  const authority = soa ? [soa] : [];
  return [
    ...greeting(name).map(plain),
    plain(';; Got answer:'),
    key(`;; ->>HEADER<<- opcode: QUERY, status: ${status}, id: ${EXAMPLE_ID}`),
    plain(`;; flags: qr rd ra; QUERY: 1, ANSWER: ${answers.length}, AUTHORITY: ${authority.length}, ADDITIONAL: 1`),
    plain(BLANK),
    plain(';; OPT PSEUDOSECTION:'),
    plain(`; EDNS: version: 0, flags:; udp: ${EDNS_UDP_SIZE}`),
    plain(';; QUESTION SECTION:'),
    plain(questionText(name)),
    plain(BLANK),
    ...sectionLines('ANSWER', answers, true),
    ...sectionLines('AUTHORITY', authority, false),
    plain(`;; Query time: ${queryMs} msec`),
    plain(`;; SERVER: ${server}#${DNS_PORT}(${server}) (UDP)`),
    plain(`;; WHEN: ${whenText(at)}`),
    plain(`;; MSG SIZE  rcvd: ${replySize({ question: name, answers, ...(soa && { soa }) })}`),
    plain(BLANK),
  ];
}

/** Returns the lines the `dig` of BIND 9.18 prints for `dig <name>`, with the resolver of resolv.conf and no option, in the order it prints them. An answer is the whole output: the command line, the header with its status, the OPT pseudosection, the question, the answer section and the authority section when they hold records, and the statistics. A `dig` that got no answer prints, for each of its three attempts, the line `communications error` with the reason, then its command line and `no servers could be reached`. The id, the query time, the date and the size are examples of the game: `dig` measures them. */
export function digOutput(result: DigResult): DigLine[] {
  return result.kind === 'reply' ? replyLines(result) : failureLines(result);
}
