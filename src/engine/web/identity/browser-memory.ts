import { parseUrl } from '@/engine/web/url';
import type { HttpMessage } from '@/engine/web/schema';
import { COOKIE_HEADER, cookiesOf, type Cookie } from './cookies';

/** A cookie a browser holds and the site it came from: the host the url wrote, a name or an IP. */
export interface StoredCookie extends Cookie {
  site: string;
}

/** What the browser of each device holds after the sends so far, by the id of the device, in the order each cookie was last set. A device with no entry holds nothing. */
export type BrowserMemory = Readonly<Record<string, readonly StoredCookie[]>>;

/** Returns the message a browser puts on the wire: the same, with the Cookie header that lists what its device holds for the site of the url. A message that is not from a browser, or a site the device holds nothing for, is left as it is. */
export function withBrowserCookies(message: HttpMessage, deviceId: string, memory: BrowserMemory | undefined): HttpMessage {
  const site = parseUrl(message.url).host;
  const held = message.browser ? (memory?.[deviceId] ?? []).filter((cookie) => cookie.site === site) : [];
  return held.length === 0 ? message : { ...message, headers: { ...message.headers, [COOKIE_HEADER]: held.map(({ name, value }) => `${name}=${value}`).join('; ') } };
}

/** Returns the memory once the browser of the device receives a Set-Cookie from the site: the cookie is kept, replacing the one of the same name for that site. A header with no cookie leaves the memory as it was. */
export function rememberCookie(memory: BrowserMemory | undefined, deviceId: string, site: string, setCookie: string): BrowserMemory | undefined {
  const [cookie] = cookiesOf(setCookie);
  if (!cookie) return memory;
  const others = (memory?.[deviceId] ?? []).filter((held) => held.site !== site || held.name !== cookie.name);
  return { ...memory, [deviceId]: [...others, { site, ...cookie }] };
}
