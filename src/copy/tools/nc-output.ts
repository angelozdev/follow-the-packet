const PREFIX = 'Ncat: ';
const NCAT_VERSION = '7.93';
const NCAT_URL = 'https://nmap.org/ncat';
const BANNER = `Version ${NCAT_VERSION} ( ${NCAT_URL} )`;
const REFUSED = 'Connection refused.';
const TIMED_OUT = 'TIMEOUT.';
const MS_PER_SECOND = 1000;
const SECONDS_DECIMALS = 2;

/** What came of a connection that `nc -vz -w 3` tried: it opened to `ip` on `port` after `elapsedMs`, the host answered with a reset (the port is closed), or nobody answered within the wait. */
export type NcResult = { kind: 'open'; ip: string; port: number; elapsedMs: number } | { kind: 'refused' } | { kind: 'timeout' };

function ncat(text: string): string {
  return `${PREFIX}${text}`;
}

function bytesLine(elapsedMs: number): string {
  return ncat(`0 bytes sent, 0 bytes received in ${(elapsedMs / MS_PER_SECOND).toFixed(SECONDS_DECIMALS)} seconds.`);
}

/** Returns the lines `ncat` 7.93 of Nmap prints for `nc -vz -w 3 <address> <port>`, all on stderr and each with the prefix `Ncat: `: the version banner that `-v` prints first, then, for a connection that opened, where it connected and that nothing was sent or received (`-z`), and, for one that did not, only why (the text of the error of the system for a closed port, or the name of the status for a wait that ran out). It prints no `[tcp/...]` and no service name. The time is the round trip of the game, so it is an example. */
export function ncOutput(result: NcResult): string[] {
  const banner = ncat(BANNER);
  switch (result.kind) {
    case 'open':
      return [banner, ncat(`Connected to ${result.ip}:${result.port}.`), bytesLine(result.elapsedMs)];
    case 'refused':
      return [banner, ncat(REFUSED)];
    case 'timeout':
      return [banner, ncat(TIMED_OUT)];
  }
}
