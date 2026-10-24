import type { AppResponse } from '@/engine';

export const CURL_TIMEOUT_CODE = 28;

const COULD_NOT_CONNECT_CODE = 7;
const COULD_NOT_CONNECT = 'Could not connect to server';

/** What came of a `curl` the player sent: the server answered with `response` (and `-i` was given or not), the connection was refused by the host at `host`:`port` after `elapsedMs`, or nobody answered within the wait. */
export type CurlResult =
  | { kind: 'response'; response: Pick<AppResponse, 'startLine' | 'headers' | 'body'>; include: boolean }
  | { kind: 'refused'; host: string; port: number; elapsedMs: number }
  | { kind: 'timeout' };

function headerLines(headers: Readonly<Record<string, string>>): string[] {
  return Object.entries(headers).map(([name, value]) => `${name}: ${value}`);
}

function bodyLines(body: string): string[] {
  return body === '' ? [] : body.split('\n');
}

/** Returns the lines `curl` 8.21.0 prints for a request with the game's options. A plain `curl` prints only the body; with `-i` it prints before it the status line and the headers as the server sent them, and the blank line that ends them. A refused connection prints, on stderr, `curl: (7) Failed to connect to <host>:<port> after <N> ms: Could not connect to server`; `<N>` is the round trip of the game, so it is an example. A wait that ran out prints nothing: the code has two texts for it and which one comes out was not confirmed. */
export function curlOutput(result: CurlResult): string[] {
  switch (result.kind) {
    case 'response': {
      const { response, include } = result;
      return [...(include ? [response.startLine, ...headerLines(response.headers), ''] : []), ...bodyLines(response.body)];
    }
    case 'refused':
      return [`curl: (${COULD_NOT_CONNECT_CODE}) Failed to connect to ${result.host}:${result.port} after ${Math.round(result.elapsedMs)} ms: ${COULD_NOT_CONNECT}`];
    case 'timeout':
      return [];
  }
}
