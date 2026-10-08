import { describe, expect, it } from 'vitest';
import { echoFrom, lab03Net } from '@/testing';
import { applyAction } from './actions';

const inboundIds = (net: ReturnType<typeof lab03Net>, sgId: string) => net.securityGroups.find((g) => g.id === sgId)?.inbound.map((r) => r.id);

describe('applyAction', () => {
  it('adds and removes inbound rules', () => {
    const added = applyAction(lab03Net(), { type: 'addRule', sgId: 'sg-servidor2', rule: echoFrom('echo', 'sg-servidor1') });
    expect(inboundIds(added, 'sg-servidor2')).toEqual(['ssh-2', 'echo']);
    const removed = applyAction(added, { type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'ssh-2' });
    expect(inboundIds(removed, 'sg-servidor2')).toEqual(['echo']);
  });

  it('changes an app target and the Linux echo setting', () => {
    const targeted = applyAction(lab03Net(), { type: 'setAppTarget', instanceId: 'servidor1', target: '172.31.38.97' });
    expect(targeted.instances.find((i) => i.id === 'servidor1')?.appTarget).toBe('172.31.38.97');
    const ignoring = applyAction(lab03Net(), { type: 'setIgnoreIcmpEcho', instanceId: 'servidor2', value: true });
    expect(ignoring.instances.find((i) => i.id === 'servidor2')?.linux.ignoreIcmpEcho).toBe(true);
  });
});
