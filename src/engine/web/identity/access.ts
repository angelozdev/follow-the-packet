import type { Site } from '@/engine/web/schema';
import { credentialOf } from './basic-credential';
import { COOKIE_HEADER } from './cookies';
import { sessionUserOf, type SessionUsers } from './sessions';

type HttpHeaders = Readonly<Record<string, string>>;
type Accounts = NonNullable<Site['accounts']>;

const USER_FIELD = 'usuario';
const PASSWORD_FIELD = 'clave';

/** Why a page that asks for a role does not answer: the request has no valid credential, or its user does not have the role. */
export type Denial = { kind: 'needs-login' } | { kind: 'forbidden'; user: string };

/** Decides whether the request may enter a page that asks for this role: nothing when its user has the role, a 401 when the request has no user, and a 403 for a user without the role. The user is the one whose user and password the Authorization header presents or, when it presents none, the one of the session the Cookie header names; a password that is wrong or a session that does not exist is no user. The same request always gets the same decision. */
export function denialOf(accounts: Accounts, role: string, headers: HttpHeaders, sessionUsers: SessionUsers = []): Denial | undefined {
  const credential = credentialOf(headers);
  const user =
    accounts.users.find(({ name, password }) => name === credential?.name && password === credential.password) ?? accounts.users.find(({ name }) => name === sessionUserOf(sessionUsers, headers[COOKIE_HEADER]));
  if (!user) return { kind: 'needs-login' };
  return user.role === role ? undefined : { kind: 'forbidden', user: user.name };
}

/** Returns the name of the user whose name and password the body of a login form gives (`usuario=…&clave=…`), or nothing when the body is missing or names no user of the site with that password. */
export function loginUserOf(accounts: Accounts, body: string | undefined): string | undefined {
  const form = new URLSearchParams(body);
  return accounts.users.find(({ name, password }) => name === form.get(USER_FIELD) && password === form.get(PASSWORD_FIELD))?.name;
}

/** Returns the body of the login form that presents this user and password (`usuario=…&clave=…`), which `loginUserOf` reads back. */
export function loginFormOf(user: string, password: string): string {
  return new URLSearchParams({ [USER_FIELD]: user, [PASSWORD_FIELD]: password }).toString();
}
