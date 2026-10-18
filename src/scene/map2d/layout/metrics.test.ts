import { describe, expect, it } from 'vitest';
import { MAP_TEXT, TERMS } from '@/copy';
import type { Network } from '@/engine';
import { INCIDENTS, caseWorld, solvedWorld, startWorld } from '@/levels';
import { officeWithNames } from '@/testing';
import { MAX_NAME_LENGTH, characterCount, labelBox, labelLines, labelWidth } from './metrics';

const LONGEST_NAME = 'servidor-autoritativo-noticias';
const START_AND_SOLVED = 2;

function registeredWorlds(): Network[] {
  return INCIDENTS.flatMap((incident) => {
    const start = startWorld(INCIDENTS, incident.id);
    const cases = incident.mechanic === 'diagnose' ? incident.diagnose.cases.map((spec) => caseWorld(start, spec)) : [];
    return [start, solvedWorld(INCIDENTS, incident.id), ...cases];
  });
}

function namesOf(world: Network): string[] {
  return [...world.devices, ...world.firewalls, ...(world.routers ?? []), ...world.actors, ...(world.lans ?? [])].map(({ name }) => name);
}

describe('labelWidth', () => {
  it('a label is as wide as its characters times 7.2 px plus 14 px', () => {
    expect(labelWidth('a'.repeat(10))).toBe(86);
    expect(labelWidth(LONGEST_NAME)).toBe(230);
  });

  it('an arrow takes one character', () => {
    expect(labelWidth('→')).toBe(labelWidth('a'));
    expect(labelWidth('a→b')).toBe(labelWidth('abc'));
  });

  it('an accented letter takes one character, composed or not', () => {
    expect(characterCount('Lucía')).toBe(5);
    expect(characterCount('Lucía')).toBe(5);
    expect(labelWidth('Lucía')).toBe(labelWidth('Lucia'));
  });

  it('a locked label is as wide as its text plus the lock, and a label with the alert as wide as its text plus the alert', () => {
    const bare = labelWidth('laptop-lucia');
    expect(labelWidth('laptop-lucia', { locked: false, alert: false })).toBe(bare);
    expect(labelWidth('laptop-lucia', { locked: true })).toBe(bare + 26);
    expect(labelWidth('laptop-lucia', { alert: true })).toBe(bare + 22);
    expect(labelWidth('laptop-lucia', { locked: true, alert: true })).toBe(bare + 26 + 22);
  });

  it('measures what the player reads and not the tags of the text', () => {
    expect(labelWidth('{{router}} [[router-backbone]]')).toBe(labelWidth(`${TERMS.router.name} router-backbone`));
  });

  it('the label of 32 characters is 245 px wide', () => {
    expect(labelWidth('a'.repeat(32))).toBe(245);
  });
});

describe('labelBox', () => {
  it('a label of one line is 20 px tall', () => {
    expect(labelBox(['servidor2'])).toEqual({ width: labelWidth('servidor2'), height: 20 });
  });

  it('a label of two lines is as wide as its longer line and 36 px tall', () => {
    const lines = [TERMS['security-group'].name, 'servidor2'];
    expect(labelBox(lines)).toEqual({ width: 115, height: 36 });
    expect(labelBox([...lines].reverse())).toEqual({ width: 115, height: 36 });
  });
});

describe('labelLines', () => {
  it('the label of a firewall splits into the name of its term and the name of its resource', () => {
    expect(labelLines(MAP_TEXT.firewall['security-group']('servidor2'))).toEqual([TERMS['security-group'].name, 'servidor2']);
    expect(labelLines(MAP_TEXT.firewall['host-firewall']('tu-laptop'))).toEqual([TERMS.firewall.name, 'tu-laptop']);
  });

  it('a label with no resource name stays on one line', () => {
    expect(labelLines(MAP_TEXT.internet)).toEqual([TERMS.internet.name]);
    expect(labelLines('[[laptop-lucia]]')).toEqual(['laptop-lucia']);
  });

  it('the label of every firewall of every registered world splits in two', () => {
    const firewalls = registeredWorlds().flatMap((world) => world.firewalls);
    expect(firewalls.length).toBeGreaterThan(0);
    for (const { kind, name } of firewalls) {
      const lines = labelLines(MAP_TEXT.firewall[kind](name));
      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe(name);
    }
  });
});

describe('the names of the registered worlds', () => {
  it('every name of every registered world and incident is at most 32 characters', () => {
    const registered = registeredWorlds();
    expect(registered.length).toBeGreaterThanOrEqual(INCIDENTS.length * START_AND_SOLVED);
    const names = [...registered, officeWithNames()].flatMap(namesOf);
    expect(names).toContain(LONGEST_NAME);
    expect(names.filter((name) => characterCount(name) > MAX_NAME_LENGTH)).toEqual([]);
  });
});
