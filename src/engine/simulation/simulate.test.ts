import { describe, expect, it } from 'vitest';
import { deathPoint } from './checkpoints';
import { actor, echoFrom, inst, lab03Net, ping, tcp, withInbound, withInstance } from '@/testing';
import { simulate } from './simulate';
import type { Network } from '@/engine/network/types';

const S1 = { private: '172.31.16.131', public: '54.78.154.66' };
const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const withEcho = (): Network => withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));

describe('lab 03 en el motor', () => {
  it('paso 3: sin regla ICMP el ping muere en la entrada de servidor2 y tcpdump no ve nada', () => {
    const trace = simulate(lab03Net(), ping(inst('servidor1'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
    expect(trace.tcpdump).toEqual([]);
  });

  it('paso 5: con Echo Request desde el SG de servidor1 responde, y tcpdump ve In y Out', () => {
    const trace = simulate(withEcho(), ping(inst('servidor1'), S2.private));
    expect(trace.outcome).toBe('replied');
    expect(trace.tcpdump.map((l) => `${l.instanceId} ${l.direction}`)).toEqual(['servidor2 In', 'servidor2 Out']);
  });

  it('V1: stateful; la respuesta vuelve sin regla en servidor1, pero al revés no pasa', () => {
    expect(simulate(withEcho(), ping(inst('servidor1'), S2.private)).outcome).toBe('replied');
    const back = simulate(withEcho(), ping(inst('servidor2'), S1.private));
    expect(back.outcome).toBe('timeout');
    expect(deathPoint(back)).toEqual({ stage: 'sg-in', at: 'servidor1' });
  });

  it('V5: una regla Echo Reply no deja entrar un ping', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('reply', 'sg-servidor1', 0));
    expect(simulate(net, ping(inst('servidor1'), S2.private)).outcome).toBe('timeout');
  });

  it('V2: por la IP pública el origen cambia (NAT) y la regla con SG como origen no coincide', () => {
    const trace = simulate(withEcho(), ping(inst('servidor1'), S2.public));
    expect(trace.steps.some((s) => s.stage === 'nat')).toBe(true);
    expect(trace.effectiveSource).toBe(S1.public);
    expect(trace.outcome).toBe('timeout');
    const sgIn = trace.steps.find((s) => s.stage === 'sg-in');
    expect(sgIn?.checks?.find((c) => c.ruleId === 'echo')).toMatchObject({ what: true, from: false });
  });

  it('V2: con la IP pública de servidor1 como origen /32, sí pasa por la pública', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', {
      id: 'echo-public',
      what: { kind: 'icmp', icmpType: 8 },
      peer: { kind: 'cidr', cidr: `${S1.public}/32` },
    });
    expect(simulate(net, ping(inst('servidor1'), S2.public)).outcome).toBe('replied');
  });

  it('V3: por el nombre público desde dentro resuelve a la IP privada y responde', () => {
    const trace = simulate(withEcho(), ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(trace.resolvedIp).toBe(S2.private);
    expect(trace.outcome).toBe('replied');
  });

  it('V4: el ping desde tu Mac a la IP pública se descarta aunque tu IP tenga SSH', () => {
    const trace = simulate(withEcho(), ping(actor('you'), S2.public));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
  });

  it('V6: Linux que ignora el ping; llega (tcpdump In) pero nadie responde', () => {
    const net = withInstance(withEcho(), 'servidor2', { linux: { ignoreIcmpEcho: true, listeningTcpPorts: [22] } });
    const trace = simulate(net, ping(inst('servidor1'), S2.private));
    expect(trace.outcome).toBe('arrived-no-reply');
    expect(deathPoint(trace)).toEqual({ stage: 'linux', at: 'servidor2' });
    expect(trace.tcpdump.map((l) => l.direction)).toEqual(['In']);
  });

  it('TCP a un puerto sin programa escuchando: connection refused', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', {
      id: 'web',
      what: { kind: 'tcp', fromPort: 80, toPort: 80 },
      peer: { kind: 'sg', sgId: 'sg-servidor1' },
    });
    const trace = simulate(net, tcp(inst('servidor1'), S2.private, 80));
    expect(trace.outcome).toBe('refused');
    expect(trace.tcpdump.map((l) => l.summary)).toEqual(['TCP 80', 'TCP 80 RST']);
  });

  it('una IP privada desde internet no tiene camino: timeout en el internet gateway', () => {
    const trace = simulate(lab03Net(), ping(actor('attacker'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });
  });

  it('V8: el SG default solo deja entrar a sus miembros', () => {
    const onlyServer2 = withInstance(lab03Net(), 'servidor2', { sgIds: ['sg-servidor2', 'sg-default'] });
    expect(simulate(onlyServer2, ping(inst('servidor1'), S2.private)).outcome).toBe('timeout');
    const both = withInstance(onlyServer2, 'servidor1', { sgIds: ['sg-servidor1', 'sg-default'] });
    expect(simulate(both, ping(inst('servidor1'), S2.private)).outcome).toBe('replied');
  });

  it('sin IP pública no se sale a internet', () => {
    const net = withInstance(withEcho(), 'servidor1', { publicIp: undefined });
    const trace = simulate(net, ping(inst('servidor1'), S2.public));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });
  });

  it('la salida del origen también cuenta', () => {
    const net: Network = {
      ...withEcho(),
      securityGroups: withEcho().securityGroups.map((g) => (g.id === 'sg-servidor1' ? { ...g, outbound: [] } : g)),
    };
    const trace = simulate(net, ping(inst('servidor1'), S2.private));
    expect(deathPoint(trace)).toEqual({ stage: 'sg-out', at: 'servidor1' });
  });

  it('un nombre desconocido no se resuelve', () => {
    const trace = simulate(lab03Net(), ping(inst('servidor1'), 'no-existe.example'));
    expect(trace.outcome).toBe('unresolved');
    expect(deathPoint(trace)).toEqual({ stage: 'dns', at: 'servidor1' });
  });
});
