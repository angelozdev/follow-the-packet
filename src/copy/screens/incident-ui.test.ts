import { describe, expect, it } from 'vitest';
import { termsIn, toPlainText } from '@/copy/term-text';
import type { TermId } from '@/copy/terms';
import { MAP_TEXT, ROLES, type Role } from './incident-ui';

const ROLE_WORDS: Record<Role, string> = {
  resolver: 'resolutor de DNS',
  authoritative: 'servidor autoritativo',
  web: 'servidor web',
  proxy: 'proxy inverso',
  app: 'app, servidor de origen',
};
const ROLE_TERMS: Partial<Record<Role, TermId>> = { resolver: 'resolver', authoritative: 'authoritative-server', web: 'web-server' };
const NO_TERMS = new Set<TermId>();

describe('the words of the roles of a server', () => {
  it('the words of the roles name each term once the player knows it and use a plain word before', () => {
    const known = new Set<TermId>(['resolver', 'authoritative-server', 'web-server']);
    expect([...ROLES].sort()).toEqual(Object.keys(ROLE_WORDS).sort());
    for (const role of ROLES) {
      const term = ROLE_TERMS[role];
      expect(toPlainText(MAP_TEXT.roles([role], known)), role).toBe(ROLE_WORDS[role]);
      expect(toPlainText(MAP_TEXT.roles([role], NO_TERMS)), role).toBe(ROLE_WORDS[role]);
      expect(termsIn(MAP_TEXT.roles([role], known)), role).toEqual(term === undefined ? [] : [term]);
      expect(termsIn(MAP_TEXT.roles([role], NO_TERMS)), role).toEqual([]);
      expect(termsIn(MAP_TEXT.roles([role])), `${role} with no list of known terms`).toEqual(term === undefined ? [] : [term]);
    }
  });

  it('a server with two roles says both in words', () => {
    expect(toPlainText(MAP_TEXT.roles(['proxy', 'web']))).toBe('proxy inverso y servidor web');
    expect(toPlainText(MAP_TEXT.roles(['resolver']))).toBe('resolutor de DNS');
  });

  it('the line of a card names the role or the roles before the words', () => {
    expect(toPlainText(MAP_TEXT.rolesLine(['resolver']))).toBe('Papel: resolutor de DNS');
    expect(toPlainText(MAP_TEXT.rolesLine(['proxy', 'web']))).toBe('Papeles: proxy inverso y servidor web');
  });
});
