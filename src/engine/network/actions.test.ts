import { describe, expect, it } from 'vitest';
import { echoFrom, lab03Net } from '@/testing';
import { applyAction } from './actions';

const inboundIds = (net: ReturnType<typeof lab03Net>, firewallId: string) => net.firewalls.find((f) => f.id === firewallId)?.inbound.map((r) => r.id);

describe('applyAction', () => {
  it('adds and removes inbound rules', () => {
    const added = applyAction(lab03Net(), { type: 'addRule', firewallId: 'sg-servidor2', rule: echoFrom('echo', 'sg-servidor1') });
    expect(inboundIds(added, 'sg-servidor2')).toEqual(['ssh-2', 'echo']);
    const removed = applyAction(added, { type: 'removeRule', firewallId: 'sg-servidor2', ruleId: 'ssh-2' });
    expect(inboundIds(removed, 'sg-servidor2')).toEqual(['echo']);
  });

  it('changes an app target and the host echo setting', () => {
    const targeted = applyAction(lab03Net(), { type: 'setAppTarget', deviceId: 'servidor1', target: '172.31.38.97' });
    expect(targeted.devices.find((d) => d.id === 'servidor1')?.appTarget).toBe('172.31.38.97');
    const ignoring = applyAction(lab03Net(), { type: 'setIgnoreIcmpEcho', deviceId: 'servidor2', value: true });
    expect(ignoring.devices.find((d) => d.id === 'servidor2')?.host.ignoreIcmpEcho).toBe(true);
  });
});
