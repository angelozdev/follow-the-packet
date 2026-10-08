import { describe, expect, it } from 'vitest';
import { actor, inst, lab03Net, ping } from '@/testing';
import { formatPacket } from './packet-labels';

describe('packet labels', () => {
  it('describes a packet by service, source name and destination', () => {
    const net = lab03Net();
    expect(formatPacket(ping(inst('servidor1'), '172.31.38.97'), net)).toBe('ping de servidor1 a 172.31.38.97');
    expect(formatPacket(ping(actor('probe-internet'), '34.244.254.100'), net)).toBe('ping de Internet a 34.244.254.100');
  });
});
