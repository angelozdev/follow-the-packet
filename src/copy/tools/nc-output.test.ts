import { describe, expect, it } from 'vitest';
import { ncOutput, type NcResult } from './nc-output';

const SOURCE_READ = '2026-10-11';
const NCAT_FORMATS = [
  {
    format: /^Ncat: Version 7\.93 \( https:\/\/nmap\.org\/ncat \)$/,
    source: `ncat/ncat_main.c:215-218 (print_banner), called at :672-673 when -v is given, ncat/ncat.h:81-83 (NCAT_NAME, NCAT_URL, NCAT_VERSION) and ncat/util.c:126-135 (loguser, which writes the prefix), nmap-7.93, read ${SOURCE_READ}`,
  },
  {
    format: /^Ncat: Connected to \d+\.\d+\.\d+\.\d+:\d+\.$/,
    source: `ncat/ncat_connect.c:274 and :288 (connect_report), nmap-7.93, read ${SOURCE_READ}`,
  },
  {
    format: /^Ncat: 0 bytes sent, 0 bytes received in \d+\.\d{2} seconds\.$/,
    source: `ncat/ncat_connect.c:1141 (the end of ncat_connect), nmap-7.93, read ${SOURCE_READ}; -z makes the loop quit after the connection (:1265-1267), so nothing is sent or received`,
  },
  {
    format: /^Ncat: Connection refused\.$/,
    source: `ncat/ncat_connect.c:1245-1248 (connect_handler) prints socket_strerror (nbase/nbase_misc.c:110-124, strerror on Linux), whose text for ECONNREFUSED is in glibc 2.34 sysdeps/gnu/errlist.h:422 (read ${SOURCE_READ})`,
  },
  {
    format: /^Ncat: TIMEOUT\.$/,
    source: `ncat/ncat_connect.c:1245-1248 (connect_handler) prints nse_status2str (nsock/src/nsock_event.c:521-526), nmap-7.93, read ${SOURCE_READ}`,
  },
];
const OPEN: NcResult = { kind: 'open', ip: '192.168.1.11', port: 3000, elapsedMs: 84 };
const EVERY_RESULT: NcResult[] = [OPEN, { kind: 'refused' }, { kind: 'timeout' }];
const BANNER = 'Ncat: Version 7.93 ( https://nmap.org/ncat )';

describe('ncOutput', () => {
  it('a success prints the Version, Connected and bytes lines of ncat, each with the prefix Ncat: ', () => {
    expect(ncOutput(OPEN)).toEqual([BANNER, 'Ncat: Connected to 192.168.1.11:3000.', 'Ncat: 0 bytes sent, 0 bytes received in 0.08 seconds.']);
  });

  it('a refusal prints Ncat: Connection refused.', () => {
    expect(ncOutput({ kind: 'refused' })).toEqual([BANNER, 'Ncat: Connection refused.']);
  });

  it('a timeout prints Ncat: TIMEOUT.', () => {
    expect(ncOutput({ kind: 'timeout' })).toEqual([BANNER, 'Ncat: TIMEOUT.']);
  });

  it('the output of nc has no tcp, no service name and no line that ncat_connect.c does not print', () => {
    const lines = EVERY_RESULT.flatMap(ncOutput);
    expect(lines.filter((line) => /\b(tcp|udp|http|ssh|ssl)\b|[[\]]|succeeded/i.test(line))).toEqual([]);
    expect(lines.filter((line) => !NCAT_FORMATS.some(({ format }) => format.test(line)))).toEqual([]);
  });

  it.each(NCAT_FORMATS)('every line nc prints matches the format of ncat_connect.c of Nmap 7.93: $format ($source)', ({ format }) => {
    const lines = EVERY_RESULT.flatMap(ncOutput);
    expect(lines.filter((line) => format.test(line)).length).toBeGreaterThan(0);
  });

  it('the time of the bytes line is the round trip of the game in seconds with two decimals, as the %.2f of ncat', () => {
    const seconds = (elapsedMs: number) => ncOutput({ ...OPEN, elapsedMs }).at(-1);
    expect(seconds(2)).toBe('Ncat: 0 bytes sent, 0 bytes received in 0.00 seconds.');
    expect(seconds(84)).toBe('Ncat: 0 bytes sent, 0 bytes received in 0.08 seconds.');
    expect(seconds(1500)).toBe('Ncat: 0 bytes sent, 0 bytes received in 1.50 seconds.');
  });
});
