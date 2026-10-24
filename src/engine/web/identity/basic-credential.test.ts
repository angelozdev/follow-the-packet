import { describe, expect, it } from 'vitest';
import { basicAuthorizationHeader, credentialOf } from './basic-credential';

const MARTA = 'marta:clave-marta';

describe('the basic credential', () => {
  it('the basic credential is the base64 of user and password', () => {
    expect(basicAuthorizationHeader(MARTA)).toEqual({ Authorization: 'Basic bWFydGE6Y2xhdmUtbWFydGE=' });
    expect(basicAuthorizationHeader(MARTA).Authorization).toBe(`Basic ${Buffer.from(MARTA).toString('base64')}`);
  });

  it('a user or a password with an accent is written in UTF-8 before the base64', () => {
    const accented = 'lucía:contraseña';
    expect(basicAuthorizationHeader(accented).Authorization).toBe(`Basic ${Buffer.from(accented, 'utf8').toString('base64')}`);
    expect(credentialOf(basicAuthorizationHeader(accented))).toEqual({ name: 'lucía', password: 'contraseña' });
  });

  it('the credential is read back from the header, split on the first colon', () => {
    expect(credentialOf(basicAuthorizationHeader(MARTA))).toEqual({ name: 'marta', password: 'clave-marta' });
    expect(credentialOf(basicAuthorizationHeader('marta:a:b'))).toEqual({ name: 'marta', password: 'a:b' });
  });

  it('a header that is not a basic credential gives none', () => {
    for (const headers of [{} as Record<string, string>, { Authorization: 'Bearer abc' }, { Authorization: 'Basic' }, { Authorization: 'Basic ***' }, { Authorization: `Basic ${Buffer.from('marta').toString('base64')}` }, { Authorization: 'Basic /w==' }]) {
      expect(credentialOf(headers), JSON.stringify(headers)).toBeUndefined();
    }
  });
});
