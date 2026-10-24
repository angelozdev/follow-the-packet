import { describe, expect, it } from 'vitest';
import { WEB_BOX_TEXT } from '@/copy/web/web-text';
import { curlOutput, type CurlResult } from './curl-output';

const SOURCE_READ = '2026-10-24';
const CURL_SOURCE = `curl-8.21.0 (https://curl.se/download/curl-8.21.0.tar.xz), read ${SOURCE_READ}`;
const BODY = 'Pedido 7: 2 cafés';
const STATUS_LINE = 'HTTP/1.1 200 OK';
const HEADERS = { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': '19' };
const RESPONSE = { startLine: STATUS_LINE, headers: HEADERS, body: BODY };
const PLAIN: CurlResult = { kind: 'response', response: RESPONSE, include: false };
const WITH_HEADERS: CurlResult = { kind: 'response', response: RESPONSE, include: true };
const REFUSED: CurlResult = { kind: 'refused', host: 'localhost', port: 80, elapsedMs: 0 };
const TIMEOUT: CurlResult = { kind: 'timeout' };
const EVERY_RESULT: CurlResult[] = [PLAIN, WITH_HEADERS, REFUSED, TIMEOUT];

const CURL_FORMATS = [
  {
    format: /^HTTP\/1\.1 \d{3} .+$/,
    source: `lib/http.c:4357 (http_rw_hd hands the status line to the tool as the first header, CLIENTWRITE_STATUS, only if it reads HTTP/1.x and three digits at :4263-4290) and src/tool_cb_hdr.c:545 (tool_header_cb writes the line as it came), ${CURL_SOURCE}`,
  },
  {
    format: /^[A-Za-z][A-Za-z-]*: .+$/,
    source: `lib/http.c:4240-4400 (every header line the server sent goes to the header callback) and src/tool_cb_hdr.c:545 (written as it came), ${CURL_SOURCE}`,
  },
  {
    format: /^$/,
    source: `lib/http.c:4232 and :4214 (the empty line that ends the headers is written with http_write_header, :1615) and src/tool_cb_hdr.c:545, ${CURL_SOURCE}`,
  },
  {
    format: /^curl: \(7\) Failed to connect to [^\s:]+:\d+ after \d+ ms: Could not connect to server$/,
    source: `src/tool_operate.c:619 (curl: (%d) %s on stderr), lib/cf-ip-happy.c:738 ("Failed to connect to %s:%u%s %s%s%safter %ld ms: %s" with no via and no proxy), lib/strerror.c:61 (CURLE_COULDNT_CONNECT) and include/curl/curl.h:527 (code 7), ${CURL_SOURCE}`,
  },
  {
    format: new RegExp(`^${BODY}$`),
    source: `src/tool_cb_wrt.c:341 (tool_write_cb writes the body to the output as it came), ${CURL_SOURCE}`,
  },
];

describe('curlOutput', () => {
  it('a plain curl prints only the body', () => {
    expect(curlOutput(PLAIN)).toEqual([BODY]);
    expect(curlOutput({ kind: 'response', response: { ...RESPONSE, startLine: 'HTTP/1.1 404 Not Found', body: 'No hay nada en esa URL.' }, include: false })).toEqual(['No hay nada en esa URL.']);
    expect(curlOutput({ kind: 'response', response: { ...RESPONSE, body: '' }, include: false })).toEqual([]);
  });

  it('curl -i prints the status line, the headers and a blank line before the body', () => {
    expect(curlOutput(WITH_HEADERS)).toEqual([STATUS_LINE, 'Content-Type: text/plain; charset=utf-8', 'Content-Length: 19', '', BODY]);
  });

  it('a refused connection prints the line of code 7 with host and port and Could not connect to server', () => {
    expect(curlOutput(REFUSED)).toEqual(['curl: (7) Failed to connect to localhost:80 after 0 ms: Could not connect to server']);
    expect(curlOutput({ kind: 'refused', host: '192.168.1.11', port: 3001, elapsedMs: 3.4 })).toEqual(['curl: (7) Failed to connect to 192.168.1.11:3001 after 3 ms: Could not connect to server']);
  });

  it('a connection that times out prints no line and the box says curl waited and gave up with code 28', () => {
    expect(curlOutput(TIMEOUT)).toEqual([]);
    expect(WEB_BOX_TEXT.curlGaveUp(3)).toBe('curl esperó 3 segundos y se rindió (código 28).');
    expect(WEB_BOX_TEXT.curlGaveUp(1)).toBe('curl esperó 1 segundo y se rindió (código 28).');
    expect(WEB_BOX_TEXT.curlGaveUp()).toBe('curl esperó y se rindió (código 28).');
  });

  it('every line curl prints matches the source of curl 8.21.0', () => {
    const lines = EVERY_RESULT.flatMap(curlOutput);
    expect(lines.filter((line) => !CURL_FORMATS.some(({ format }) => format.test(line)))).toEqual([]);
    for (const { format, source } of CURL_FORMATS) expect(lines.filter((line) => format.test(line)).length, source).toBeGreaterThan(0);
  });

  it('a line that the source cannot confirm is not printed', () => {
    expect(curlOutput(TIMEOUT)).toEqual([]);
    const lines = EVERY_RESULT.flatMap(curlOutput);
    expect(lines.filter((line) => /Connection timed out|Timeout was reached|Connection timeout|Could not resolve|Empty reply|Connected to|\* |^[<>] /.test(line))).toEqual([]);
    expect(curlOutput(PLAIN).filter((line) => line.startsWith('HTTP/'))).toEqual([]);
  });

  it('prints the body as many lines as it has and nothing after the last one', () => {
    expect(curlOutput({ kind: 'response', response: { ...RESPONSE, body: 'uno\ndos' }, include: false })).toEqual(['uno', 'dos']);
  });
});
