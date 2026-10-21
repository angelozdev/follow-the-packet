import { describe, expect, it } from 'vitest';
import { simulate, type AnswerRecord, type SoaRecord } from '@/engine';
import { NAME_SERVER_PIECES, device, dig, officeWithNames } from '@/testing';
import { digOutput, type DigFailure, type DigReply, type DigResult } from './dig-output';

const SOURCE_READ = '2026-10-11';
const BIND = `bind-9.18.50, read ${SOURCE_READ}`;
const TAB = '\t';
const SERVER = NAME_SERVER_PIECES.resolver.ip;
const QUESTION = `www.${NAME_SERVER_PIECES.zone}`;
const MISSING = `noexiste.${NAME_SERVER_PIECES.zone}`;

const address = (name: string, value: string, ttl = 300): AnswerRecord => ({ name, type: 'A', value, ttl });
const ZONE_SOA: SoaRecord = {
  name: NAME_SERVER_PIECES.zone,
  type: 'SOA',
  ttl: 300,
  value: { mname: `ns1.${NAME_SERVER_PIECES.zone}`, rname: `hostmaster.${NAME_SERVER_PIECES.zone}`, serial: 2026101101, refresh: 1800, retry: 900, expire: 1209600, minimum: 1200 },
};
const REPLY: DigReply = { kind: 'reply', name: QUESTION, status: 'NOERROR', answers: [address(QUESTION, '198.51.100.50')], server: SERVER, queryMs: 84, at: 0 };
const NXDOMAIN: DigReply = { ...REPLY, name: MISSING, status: 'NXDOMAIN', answers: [], soa: ZONE_SOA };
const SERVFAIL: DigReply = { ...REPLY, status: 'SERVFAIL', answers: [] };
const NO_DATA: DigReply = { ...REPLY, answers: [], soa: ZONE_SOA };
const TIMEOUT: DigFailure = { kind: 'timeout', name: QUESTION, server: SERVER };
const REFUSED: DigFailure = { kind: 'refused', name: QUESTION, server: SERVER };
const EVERY_RESULT: DigResult[] = [REPLY, NXDOMAIN, SERVFAIL, NO_DATA, TIMEOUT, REFUSED];

const textOf = (result: DigResult) => digOutput(result).map(({ text }) => text);
const keyOf = (result: DigResult) => digOutput(result).flatMap(({ text, key }) => (key ? [text] : []));
const BLANK = '';
const DIG_FORMATS = [
  { format: /^$/, source: `dig.c:1013-1043 (printgreeting: the "\\n" that opens the first command line) and :993 and :413 (the blank lines after the header and at the end), ${BIND}` },
  { format: /^; <<>> DiG 9\.18\.50 <<>> \S+$/, source: `dig.c:1013-1043 (printgreeting) and configure.ac:17-23 (PACKAGE_VERSION 9.18.50), ${BIND}` },
  { format: /^;; global options: \+cmd$/, source: `dig.c:1036-1042 (printgreeting), ${BIND}` },
  { format: /^;; Got answer:$/, source: `dig.c:831 (printmessage), ${BIND}` },
  { format: /^;; ->>HEADER<<- opcode: QUERY, status: (NOERROR|NXDOMAIN|SERVFAIL), id: \d+$/, source: `dig.c:841-843 (printmessage); opcode from lib/dns/message.c:131 and status from rcode_totext, ${BIND}` },
  { format: /^;; flags: qr rd ra; QUERY: 1, ANSWER: \d, AUTHORITY: \d, ADDITIONAL: 1$/, source: `dig.c:845-871 (printmessage), ${BIND}` },
  { format: /^;; OPT PSEUDOSECTION:$/, source: `lib/dns/message.c:3883 (dns_message_pseudosectiontotext), ${BIND}` },
  { format: /^; EDNS: version: 0, flags:; udp: 1232$/, source: `lib/dns/message.c:3887-3908 (dns_message_pseudosectiontotext), ${BIND}; 1232 is the default max-udp-size of named, doc/arm/reference.rst` },
  { format: /^;; (QUESTION|ANSWER|AUTHORITY) SECTION:$/, source: `lib/dns/message.c:125-126 (sectiontext) and :3291, :3309-3312 and :3369 (dns_message_sectiontotext: an empty section prints nothing, a full one prints its header and a blank line after it), ${BIND}` },
  { format: /^;[a-z.]+\.\t+IN\tA$/, source: `lib/dns/masterdump.c:821-880 (question_totext), the columns of dig.c:688-690, ${BIND}` },
  { format: /^[a-z.]+\.\t+\d+\tIN\t(A|CNAME|SOA)\t\S.*$/, source: `lib/dns/masterdump.c:573-740 (rdataset_totext), lib/dns/rdata/generic/soa_6.c, cname_5.c and in_1/a_1.c, ${BIND}` },
  { format: /^;; Query time: \d+ msec$/, source: `dig.c:369 (received), ${BIND}` },
  { format: /^;; SERVER: [\d.]+#53\([\d.]+\) \(UDP\)$/, source: `dig.c:386 (received) and dighost.c get_server_list (the name of a server of resolv.conf is its address), ${BIND}` },
  { format: /^;; WHEN: (Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{2} \d{2}:\d{2}:\d{2} UTC \d{4}$/, source: `dig.c:388-394 (received: strftime %a %b %d %H:%M:%S %Z %Y), ${BIND}` },
  { format: /^;; MSG SIZE {2}rcvd: \d+$/, source: `dig.c:402 (received), ${BIND}` },
  { format: /^;; communications error to [\d.]+#53: (timed out|connection refused)$/, source: `dighost.c:4047 (recv_done), text of lib/isc/result.c:25 and :35, ${BIND}` },
  { format: /^;; no servers could be reached$/, source: `dighost.c:4119-4120 (recv_done), ${BIND}` },
];

describe('digOutput', () => {
  it('the header line has the opcode, the status and the id', () => {
    expect(keyOf(REPLY)[0]).toMatch(/^;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: \d+$/);
  });

  it('an NXDOMAIN answer prints status NXDOMAIN and a SERVFAIL answer prints status SERVFAIL', () => {
    expect(textOf(NXDOMAIN).filter((line) => line.includes('->>HEADER<<-'))).toEqual([expect.stringContaining('status: NXDOMAIN')]);
    expect(textOf(SERVFAIL).filter((line) => line.includes('->>HEADER<<-'))).toEqual([expect.stringContaining('status: SERVFAIL')]);
    expect(textOf(NXDOMAIN)).toContain(';; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1');
    expect(textOf(SERVFAIL)).toContain(';; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 1');
  });

  it('an NXDOMAIN prints the SOA of the zone in the authority section with the TTL of RFC 2308', () => {
    const { dns } = simulate(officeWithNames(), dig(device('your-laptop'), MISSING));
    if (dns?.status !== 'NXDOMAIN' || !dns.soa) throw new Error('the dig of a missing name did not end as NXDOMAIN with its SOA');
    const zone = NAME_SERVER_PIECES.zone;
    const soaLine = (ttl: number) => `${zone}.${TAB}${TAB}${ttl}${TAB}IN${TAB}SOA${TAB}ns1.${zone}. hostmaster.${zone}. 2026101101 1800 900 1209600 1200`;
    const printed = textOf({ ...NXDOMAIN, soa: dns.soa });
    expect(dns.soa.ttl).toBe(Math.min(ZONE_SOA.ttl, dns.soa.value.minimum));
    expect(printed.slice(printed.indexOf(';; AUTHORITY SECTION:'))[1]).toBe(soaLine(dns.soa.ttl));
    expect(textOf({ ...NXDOMAIN, soa: { ...ZONE_SOA, ttl: 120 } })).toContain(soaLine(120));
  });

  it('the authority section of a NOERROR and of a SERVFAIL prints only what the source confirms', () => {
    for (const result of [REPLY, SERVFAIL]) expect(textOf(result).filter((line) => line.includes('AUTHORITY'))).toEqual([expect.stringContaining('AUTHORITY: 0')]);
    expect(textOf(NO_DATA)).toContain(';; AUTHORITY SECTION:');
    expect(textOf(REPLY)).not.toContain(';; AUTHORITY SECTION:');
  });

  it('a timeout prints communications error and no servers could be reached, as BIND 9.18 does', () => {
    const attempt = `;; communications error to ${SERVER}#53: timed out`;
    expect(textOf(TIMEOUT)).toEqual([attempt, attempt, attempt, BLANK, `; <<>> DiG 9.18.50 <<>> ${QUESTION}`, ';; global options: +cmd', ';; no servers could be reached']);
  });

  it('a timeout prints no line that the source cannot confirm', () => {
    const lines = textOf(TIMEOUT);
    expect(lines.filter((line) => !DIG_FORMATS.some(({ format }) => format.test(line)))).toEqual([]);
    expect(lines.filter((line) => /HEADER|SECTION|Query time|SERVER|WHEN|MSG SIZE|connection timed out/.test(line))).toEqual([]);
    expect(digOutput(TIMEOUT).some(({ key }) => key)).toBe(false);
  });

  it('a refused query prints communications error with connection refused', () => {
    const attempt = `;; communications error to ${SERVER}#53: connection refused`;
    expect(textOf(REFUSED)).toEqual([attempt, attempt, attempt, BLANK, `; <<>> DiG 9.18.50 <<>> ${QUESTION}`, ';; global options: +cmd', ';; no servers could be reached']);
  });

  it('the server line has the resolver ip and the port 53', () => {
    expect(textOf(REPLY)).toContain(`;; SERVER: ${SERVER}#53(${SERVER}) (UDP)`);
    expect(textOf({ ...REPLY, server: '10.0.0.2' })).toContain(';; SERVER: 10.0.0.2#53(10.0.0.2) (UDP)');
  });

  it.each(DIG_FORMATS)('every line dig prints matches the format of dig.c and dighost.c of BIND 9.18: $format ($source)', ({ format }) => {
    expect(EVERY_RESULT.flatMap(textOf).filter((line) => format.test(line)).length).toBeGreaterThan(0);
  });

  it('every line dig prints matches one format of dig.c and dighost.c of BIND 9.18', () => {
    const lines = EVERY_RESULT.flatMap(textOf);
    expect(lines.filter((line) => !DIG_FORMATS.some(({ format }) => format.test(line)))).toEqual([]);
  });

  it('puts the question and the records in the columns of masterdump.c, as dig 9.10.6 printed them on this Mac on 2026-10-11 [local]', () => {
    const real = { ...REPLY, name: 'example.com', answers: [address('example.com', '172.66.147.243', 34)] };
    expect(textOf(real)).toContain(`;example.com.${TAB}${TAB}${TAB}IN${TAB}A`);
    expect(textOf(real)).toContain(`example.com.${TAB}${TAB}34${TAB}IN${TAB}A${TAB}172.66.147.243`);
    expect(textOf(REPLY)).toContain(`${QUESTION}.${TAB}300${TAB}IN${TAB}A${TAB}198.51.100.50`);
    const long = `a-much-longer-name.${NAME_SERVER_PIECES.zone}`;
    expect(textOf({ ...REPLY, name: long, answers: [address(long, '198.51.100.50')] })).toContain(`${long}. 300 IN A${TAB}198.51.100.50`);
  });

  it('prints an alias before its address, each record with the TTL it has left', () => {
    const answers: AnswerRecord[] = [{ name: `blog.${NAME_SERVER_PIECES.zone}`, type: 'CNAME', value: QUESTION, ttl: 240 }, address(QUESTION, '198.51.100.50', 240)];
    const printed = textOf({ ...REPLY, name: `blog.${NAME_SERVER_PIECES.zone}`, answers });
    expect(printed).toContain(`;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1`);
    expect(printed).toContain(`blog.${NAME_SERVER_PIECES.zone}.${TAB}240${TAB}IN${TAB}CNAME${TAB}${QUESTION}.`);
    expect(printed).toContain(`${QUESTION}.${TAB}240${TAB}IN${TAB}A${TAB}198.51.100.50`);
  });

  it('the key lines are the status and the answer: the header, the answer section and its records', () => {
    expect(keyOf(REPLY)).toEqual([expect.stringContaining('->>HEADER<<-'), ';; ANSWER SECTION:', `${QUESTION}.${TAB}300${TAB}IN${TAB}A${TAB}198.51.100.50`]);
    expect(keyOf(NXDOMAIN)).toEqual([expect.stringContaining('status: NXDOMAIN')]);
  });

  it('the query time is the round trip of the game, the date follows the game clock and the size is the one of the message', () => {
    expect(textOf(REPLY)).toContain(';; Query time: 84 msec');
    expect(textOf(REPLY)).toContain(';; WHEN: Sun Oct 11 10:15:00 UTC 2026');
    expect(textOf({ ...REPLY, at: 3720 })).toContain(';; WHEN: Sun Oct 11 11:17:00 UTC 2026');
    expect(textOf(REPLY)).toContain(';; MSG SIZE  rcvd: 62');
    expect(textOf(NXDOMAIN)).toContain(';; MSG SIZE  rcvd: 102');
  });
});
