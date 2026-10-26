import type { AppRequest } from '@/engine/web/messages';
import type { HttpMessage, Origin, Site } from '@/engine/web/schema';

const HOST = 'Host';
const CONTENT_LENGTH = 'Content-Length';
const FORWARDED_FOR = 'X-Forwarded-For';
const TRAILING_SLASH = /\/$/;

function isUnder(path: string, prefix: string): boolean {
  const base = prefix.replace(TRAILING_SLASH, '');
  return path === base || path.startsWith(`${base}/`);
}

export function originOf({ proxy }: Site, { path }: AppRequest): Origin | undefined {
  return proxy?.prefixes.some((prefix) => isUnder(path, prefix)) ? proxy.origins[0] : undefined;
}

export function upstreamMessageOf({ method, headers, path, query, body }: AppRequest, clientIp: string): HttpMessage {
  const kept = Object.entries(headers).filter(([name]) => name !== HOST && name !== CONTENT_LENGTH);
  const forwardedFor = [headers[FORWARDED_FOR], clientIp].filter((entry) => entry !== undefined).join(', ');
  return {
    method,
    url: `http://${headers[HOST]}${path}${query === undefined ? '' : `?${query}`}`,
    headers: { ...Object.fromEntries(kept), [FORWARDED_FOR]: forwardedFor },
    ...(body !== undefined && { body }),
  };
}
