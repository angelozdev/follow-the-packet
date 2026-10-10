import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, officeNet, officeTwoFloorsNet } from '@/testing';
import { IMPLICIT_LAN_ID, isClientActor, lanOf, lansOf } from './topology';
import type { Actor } from './types';

const { floor1, floor2, server } = OFFICE_FLOORS;

describe('lansOf', () => {
  it('lists the LANs an office declares', () => {
    expect(lansOf(officeTwoFloorsNet()).map((lan) => lan.id)).toEqual([floor1.id, floor2.id]);
  });

  it('gives an office that declares none a single LAN with its range', () => {
    expect(lansOf(officeNet()).map(({ id, cidr }) => [id, cidr])).toEqual([[IMPLICIT_LAN_ID, officeNet().cidr]]);
  });
});

describe('lanOf', () => {
  it('finds the LAN a device names', () => {
    const net = officeTwoFloorsNet();
    expect(lanOf(net, net.devices.at(-1) ?? {})?.id).toBe(floor2.id);
  });

  it('is the only LAN for a device that names none', () => {
    expect(lanOf(officeNet(), {})?.id).toBe(IMPLICIT_LAN_ID);
  });

  it('is undefined for a device that names none among several LANs, or one that does not exist', () => {
    expect(lanOf(officeTwoFloorsNet(), {})).toBeUndefined();
    expect(lanOf(officeTwoFloorsNet(), { lanId: 'floor-9' })).toBeUndefined();
  });
});

describe('isClientActor', () => {
  it('is false only for a server of the internet', () => {
    const actors: Actor[] = [
      { id: 'a', name: 'a', ip: '203.0.113.66', kind: 'attacker' },
      { id: 'y', name: 'y', ip: '198.51.100.7', kind: 'you' },
      { id: 'h', name: 'h', ip: '198.51.100.24', kind: 'home' },
      { id: server.id, name: 'servidor-internet', ip: server.ip, kind: 'server', latencyMs: 20 },
    ];
    expect(actors.map(isClientActor)).toEqual([true, true, true, false]);
  });
});
