type UrlScheme = 'http' | 'https';

const DEFAULT_PORT = { http: 80, https: 443 } satisfies Record<UrlScheme, number>;

/** The parts of a url that reach the server: the scheme, the host (a name or an IP), the port (the default of the scheme when the url gives none), the path and the query string without its `?`. The fragment is not here: it never leaves the client (RFC 9110 §7.1). */
export interface ParsedUrl {
  scheme: UrlScheme;
  host: string;
  port: number;
  path: string;
  query?: string;
}

function schemeOf({ protocol }: URL): UrlScheme | undefined {
  const scheme = protocol.slice(0, -1);
  return scheme === 'http' || scheme === 'https' ? scheme : undefined;
}

/** True when the text is an absolute `http` or `https` url. */
export function isWebUrl(value: string): boolean {
  return URL.canParse(value) && schemeOf(new URL(value)) !== undefined;
}

/** Splits an absolute `http` or `https` url into the parts that reach the server: port 80 for `http` and 443 for `https` when it gives none (RFC 9110 §4.2.1 and §4.2.2), and no fragment. Throws on any other text. */
export function parseUrl(value: string): ParsedUrl {
  const url = new URL(value);
  const scheme = schemeOf(url);
  if (!scheme) throw new Error(`not an http or https url: ${value}`);
  return { scheme, host: url.hostname, port: url.port ? Number(url.port) : DEFAULT_PORT[scheme], path: url.pathname, ...(url.search && { query: url.search.slice(1) }) };
}

/** The value of the Host header of the request for the url: the host and, when the port is not the default of the scheme, a colon and the port. The host is the one the url wrote, whatever the DNS answered (inferred from RFC 9110 §7.2 in the chapter 3 spec). */
export function hostHeaderOf({ scheme, host, port }: ParsedUrl): string {
  return port === DEFAULT_PORT[scheme] ? host : `${host}:${port}`;
}

/** The target of the request line: the path and, when the url has one, its query string. */
export function targetOf({ path, query }: ParsedUrl): string {
  return query === undefined ? path : `${path}?${query}`;
}
