import { describe, expect, it } from 'vitest';
import { extraOpenings, flowKey, probePackets } from './exposure';
import { actor, echoFrom, inst, lab03Net, ping, tcp, withInbound } from './fixtures';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const expected = [
  ping(inst('servidor1'), S2.private),
  tcp(actor('you'), '54.78.154.66', 22),
  tcp(actor('you'), S2.public, 22),
];

describe('extraOpenings', () => {
  it('con la regla justa no hay aperturas de más', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    expect(extraOpenings(net, expected)).toEqual([]);
  });

  it('ICMP de todos los tipos desde el SG de servidor1 abre de más (deja entrar Echo Reply)', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'all-icmp', what: { kind: 'icmp', icmpType: 'all' }, peer: { kind: 'sg', sgId: 'sg-servidor1' } });
    const extra = extraOpenings(net, expected);
    expect(extra).toContainEqual({ from: inst('servidor1'), to: S2.private, protocol: 'icmp', icmpType: 0 });
  });

  it('Echo Request desde 0.0.0.0/0 abre a internet', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'world', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
    const extra = extraOpenings(net, expected);
    expect(extra.some((p) => p.from.kind === 'actor' && p.from.id === 'probe-internet')).toBe(true);
  });

  it('el SSH esperado desde tu Mac no cuenta como apertura de más', () => {
    expect(extraOpenings(lab03Net(), expected)).toEqual([]);
  });
});

describe('flowKey', () => {
  it('identifica el flujo por origen, instancia destino y servicio, sin importar si va por IP o nombre', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const byIp = flowKey(net, ping(inst('servidor1'), S2.private));
    const byName = flowKey(net, ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(byIp).toBe('instance:servidor1>servidor2:icmp:8');
    expect(byName).toBe(byIp);
  });
});

describe('probePackets', () => {
  it('no se sondea una instancia a sí misma', () => {
    const packets = probePackets(lab03Net());
    expect(packets.some((p) => p.from.kind === 'instance' && p.from.id === 'servidor1' && p.to === '172.31.16.131')).toBe(false);
  });
});
