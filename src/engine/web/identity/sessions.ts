import { cookiesOf } from './cookies';

export const SESSION_COOKIE = 'sesion';
const SESSION_PREFIX = 's';
const SESSION_VALUE = /^s(\d+)$/;

/** The user of each session an app opened, in the order it opened them: the session `s<n>` is the n-th. */
export type SessionUsers = readonly string[];

/** The sessions of every app after the sends so far, by the key of the app (`appKey`). An app with no entry has opened none. */
export type Sessions = Readonly<Record<string, SessionUsers>>;

/** Returns the Set-Cookie value that hands out the session in this position, counting from 1: `sesion=s1`, `sesion=s2`. */
export function sessionCookieOf(position: number): string {
  return `${SESSION_COOKIE}=${SESSION_PREFIX}${position}`;
}

/** Returns the user of the session a Cookie header names, or nothing when it names none or one the app never opened. */
export function sessionUserOf(users: SessionUsers, cookieHeader: string | undefined): string | undefined {
  const value = cookiesOf(cookieHeader).find(({ name }) => name === SESSION_COOKIE)?.value;
  const position = value === undefined ? undefined : SESSION_VALUE.exec(value)?.[1];
  return position === undefined ? undefined : users[Number(position) - 1];
}
