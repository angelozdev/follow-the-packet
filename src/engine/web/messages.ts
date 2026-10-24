import type { HttpMessage, HttpMethod } from './schema';
import { hostHeaderOf, parseUrl, targetOf } from './url';

const HTTP_VERSION = 'HTTP/1.1';
const PLAIN_TEXT = 'text/plain; charset=utf-8';
const CONTENT_TYPE = 'Content-Type';

const STATUS_PHRASE = { 200: 'OK', 400: 'Bad Request', 404: 'Not Found' } as const;

type StatusCode = keyof typeof STATUS_PHRASE;
type HttpHeaders = Readonly<Record<string, string>>;

/** The request as it travels: its start line, the method, the host the url names (without the port), the path and the query string, the headers and the body, if it has one. */
export interface AppRequest {
  startLine: string;
  method: HttpMethod;
  host: string;
  path: string;
  query?: string;
  headers: HttpHeaders;
  body?: string;
}

/** The response as it travels: its start line, the status code, the headers and the body. */
export interface AppResponse {
  startLine: string;
  statusCode: StatusCode;
  headers: HttpHeaders;
  body: string;
}

/** The length of a text in bytes, which is what Content-Length counts, not its characters. */
function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Builds the request a message makes: the Host header comes first, with the name of the url and its port when it is not the default; then the headers the message brings; then Content-Length, in bytes, when there is a body, and after it the Content-Type of the message, the order in which curl 8.21.0 writes them. The fragment of the url is not part of it. */
export function requestOf({ method, url, headers = {}, body }: HttpMessage): AppRequest {
  const parsed = parseUrl(url);
  const { [CONTENT_TYPE]: contentType, ...others } = headers;
  return {
    startLine: `${method} ${targetOf(parsed)} ${HTTP_VERSION}`,
    method,
    host: parsed.host,
    path: parsed.path,
    ...(parsed.query !== undefined && { query: parsed.query }),
    headers: { Host: hostHeaderOf(parsed), ...others, ...(body !== undefined && { 'Content-Length': String(byteLength(body)) }), ...(contentType !== undefined && { [CONTENT_TYPE]: contentType }) },
    ...(body !== undefined && { body }),
  };
}

/** Builds a response with only the headers the game teaches: Content-Type and Content-Length. */
export function responseOf(statusCode: StatusCode, body: string): AppResponse {
  return {
    startLine: `${HTTP_VERSION} ${statusCode} ${STATUS_PHRASE[statusCode]}`,
    statusCode,
    headers: { 'Content-Type': PLAIN_TEXT, 'Content-Length': String(byteLength(body)) },
    body,
  };
}
