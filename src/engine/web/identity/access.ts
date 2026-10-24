import type { Site } from '@/engine/web/schema';
import { credentialOf } from './basic-credential';

type HttpHeaders = Readonly<Record<string, string>>;

/** Why a page that asks for a role does not answer: the request has no valid credential, or its user does not have the role. */
export type Denial = { kind: 'needs-login' } | { kind: 'forbidden'; user: string };

/** Decides whether the request may enter a page that asks for this role: nothing when the credential of its Authorization header is a user of the site who has the role, a 401 when the request has no credential or it is not a user and password of the site, and a 403 for a user without the role. The same request always gets the same decision. */
export function denialOf(accounts: NonNullable<Site['accounts']>, role: string, headers: HttpHeaders): Denial | undefined {
  const credential = credentialOf(headers);
  const user = accounts.users.find(({ name, password }) => name === credential?.name && password === credential.password);
  if (!user) return { kind: 'needs-login' };
  return user.role === role ? undefined : { kind: 'forbidden', user: user.name };
}
