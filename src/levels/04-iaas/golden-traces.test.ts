import { describe, expect, it } from 'vitest';
import { extraOpenings, simulate, type Network } from '@/engine';
import type { Incident } from '@/levels/incident';
import { INCIDENTS } from '@/levels/registry';
import { applyMove, solvedWorld, startWorld } from '@/levels/world';

const CHAPTER = 4;
const FIXTURE = './golden-traces.json';
const RECORDED_KEYS = new Map([
  ['deviceId', 'instanceId'],
  ['firewallId', 'sgId'],
]);
const RECORDED_VALUES = new Map([
  ['device', 'instance'],
  ['firewall-out', 'sg-out'],
  ['firewall-in', 'sg-in'],
  ['host', 'linux'],
  ['firewall-out-pass', 'sg-out-pass'],
  ['firewall-out-drop', 'sg-out-drop'],
  ['firewall-in-pass', 'sg-in-pass'],
  ['firewall-in-drop', 'sg-in-drop'],
  ['host-unsolicited-icmp', 'linux-unsolicited-icmp'],
  ['host-ignores-echo', 'linux-ignores-echo'],
  ['host-replies', 'linux-replies'],
  ['host-refused', 'linux-refused'],
  ['host-accepts', 'linux-accepts'],
  ['host-udp-no-service', 'linux-udp-no-service'],
  ['route-no-public-device', 'route-no-public-instance'],
]);

function recorded(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(recorded);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [RECORDED_KEYS.get(key) ?? key, recorded(inner)]));
  }
  return typeof value === 'string' ? (RECORDED_VALUES.get(value) ?? value) : value;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonical(record[key])]));
  }
  return value;
}

function worlds(incident: Incident): [string, Network][] {
  const start = startWorld(INCIDENTS, incident.id);
  const placed = start.firewalls.flatMap((firewall) =>
    incident.chips.what.flatMap((what) =>
      incident.chips.from.map((from): [string, Network] => [
        `start+${firewall.id}:${what.id}<-${from.id}`,
        applyMove(start, incident, { type: 'placeRule', firewallId: firewall.id, whatId: what.id, fromId: from.id }),
      ]),
    ),
  );
  return [['start', start], ['solved', solvedWorld(INCIDENTS, incident.id)], ...placed];
}

function references(): [string, unknown][] {
  return INCIDENTS.filter((incident) => incident.chapter === CHAPTER).flatMap((incident) =>
    worlds(incident).flatMap(([name, world]): [string, unknown][] => {
      const expected = incident.flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
      return [
        ...incident.flows.map((flow): [string, unknown] => [`${incident.id} ${name} ${flow.id}`, simulate(world, flow.packet)]),
        [`${incident.id} ${name} extra-openings`, extraOpenings(world, expected)],
      ];
    }),
  );
}

function serialize(entries: [string, unknown][]): string {
  return `{\n${entries.map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(canonical(recorded(value)))}`).join(',\n')}\n}\n`;
}

describe('chapter 4 golden traces', () => {
  it('keeps every flow trace and every probe battery of 04-01 and 04-02 as recorded before the generic model', async () => {
    await expect(serialize(references())).toMatchFileSnapshot(FIXTURE);
  });
});
