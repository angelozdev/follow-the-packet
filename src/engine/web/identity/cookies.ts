export const COOKIE_HEADER = 'Cookie';
export const SET_COOKIE_HEADER = 'Set-Cookie';

const PAIR_SEPARATOR = ';';
const NAME_SEPARATOR = '=';

/** A cookie of the game: a name and a value, with no attributes. */
export interface Cookie {
  name: string;
  value: string;
}

function cookieOf(pair: string): Cookie[] {
  const split = pair.indexOf(NAME_SEPARATOR);
  return split > 0 ? [{ name: pair.slice(0, split).trim(), value: pair.slice(split + 1).trim() }] : [];
}

/** Reads the cookies a Cookie header lists (`name=value; name=value`), or the first one of a Set-Cookie header (`name=value; attribute`, whose attributes the game does not model). A part with no name is left out. */
export function cookiesOf(header: string | undefined): Cookie[] {
  return (header ?? '').split(PAIR_SEPARATOR).flatMap(cookieOf);
}
