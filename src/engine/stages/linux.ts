import { CONTINUE, describePacket, stop, type Stage } from './context';

export const linuxStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const src = ctx.effectiveSource!;
  ctx.tcpdump.push({ instanceId: dest.id, direction: 'In', src, dst: dest.privateIp, summary: describePacket(p) });

  if (p.protocol === 'icmp') {
    if (p.icmpType !== 8) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: `Llega un ${describePacket(p)} que nadie pidió: Linux no contesta.` });
      return stop('arrived-no-reply');
    }
    if (dest.linux.ignoreIcmpEcho) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: `Llega, pero Linux de ${dest.name} tiene icmp_echo_ignore_all=1 y no contesta.` });
      return stop('arrived-no-reply');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: `Linux de ${dest.name} contesta.` });
    return CONTINUE;
  }

  if (p.protocol === 'tcp') {
    if (!dest.linux.listeningTcpPorts.includes(p.port!)) {
      ctx.tcpdump.push({ instanceId: dest.id, direction: 'Out', src: dest.privateIp, dst: src, summary: `TCP ${p.port} RST` });
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'reject', reason: `Llega, pero nada escucha en el puerto ${p.port}: Linux contesta "connection refused".` });
      return stop('refused');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: `Un programa escucha en el puerto ${p.port} y acepta.` });
    return CONTINUE;
  }

  ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: `Llega un paquete UDP ${p.port}, pero en este juego ningún servicio UDP contesta.` });
  return stop('arrived-no-reply');
};
