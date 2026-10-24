const AUTHORIZATION = 'Authorization';
const BASIC = 'Basic';
const BASIC_HEADER = /^Basic ([A-Za-z0-9+/]+=*)$/i;
const SEPARATOR = ':';

type HttpHeaders = Readonly<Record<string, string>>;

/** A user name and the password it presents. */
export interface Credential {
  name: string;
  password: string;
}

function toBase64(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

function fromBase64(encoded: string): string | undefined {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0)));
  } catch {
    return undefined;
  }
}

/** Returns the Authorization header a client sends to present `user:password`: the word Basic and the base64 of that text in UTF-8 (RFC 7617 §2). */
export function basicAuthorizationHeader(userAndPassword: string): Record<typeof AUTHORIZATION, string> {
  return { [AUTHORIZATION]: `${BASIC} ${toBase64(userAndPassword)}` };
}

/** Returns the value of the WWW-Authenticate header with which a server asks for a basic credential for a realm (RFC 7617 §2). */
export function basicChallenge(realm: string): string {
  return `${BASIC} realm="${realm}"`;
}

/** Reads the user and the password from the Authorization header of a request, split on the first colon (RFC 7617 §2). Nothing when there is no such header, it is not Basic, its base64 is not valid UTF-8 or it has no colon. */
export function credentialOf(headers: HttpHeaders): Credential | undefined {
  const encoded = BASIC_HEADER.exec(headers[AUTHORIZATION] ?? '')?.[1];
  const text = encoded === undefined ? undefined : fromBase64(encoded);
  const split = text?.indexOf(SEPARATOR) ?? -1;
  return text === undefined || split < 0 ? undefined : { name: text.slice(0, split), password: text.slice(split + 1) };
}
