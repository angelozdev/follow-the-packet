import { lookupService } from '@/engine/network/services';
import { CONTINUE, arrivalOf, describePacket, logAt, receiverOf, sayRefusal, stop, type Receiver, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import { sendNotice } from '@/engine/simulation/paths/routers';
import type { Reason } from '@/engine/simulation/trace';

/** The host answers a TCP packet with a reset: it logs the RST, says it in the exchange and ends the trip as `refused`. */
function refuseTcp(ctx: SimContext, receiver: Receiver, port: number, reason: Reason): StageResult {
  logAt(ctx, receiver, 'Out', receiver.ip, ctx.effectiveSource!, `TCP ${port} RST`);
  sayRefusal(ctx);
  ctx.steps.push({ stage: 'host', at: receiver.id, verdict: 'reject', reason });
  return stop('refused');
}

/** The host answers a UDP datagram that no program takes with ICMP Port Unreachable (RFC 1122, §4.1.3.1: "UDP SHOULD send an ICMP Port Unreachable message"): it logs the message, and the warning comes from the host itself, from the IP the datagram was sent to. The game sets no rate limit. The trip ends as `unreachable`. */
function rejectUdp(ctx: SimContext, receiver: Receiver, port: number, reason: Reason): StageResult {
  const from = ctx.destIp!;
  logAt(ctx, receiver, 'Out', from, ctx.effectiveSource!, `ICMP udp port ${port} unreachable`);
  ctx.steps.push({ stage: 'host', at: receiver.id, verdict: 'reject', reason });
  return sendNotice(ctx, { kind: 'port-unreachable', fromId: receiver.id, fromIp: from });
}

const CLOSED_PORT_CODE = { tcp: 'host-refused', udp: 'host-udp-closed' } as const;

export const hostStage: Stage = (ctx) => {
  const receiver = receiverOf(ctx);
  const { id, ip, host } = receiver;
  const { ip: destinationIp, packet: p } = arrivalOf(ctx);
  const src = ctx.effectiveSource!;
  logAt(ctx, receiver, 'In', src, ip, describePacket(p));

  if (p.protocol === 'icmp') {
    if (p.icmpType !== 8) {
      ctx.steps.push({ stage: 'host', at: id, verdict: 'drop', reason: { code: 'host-unsolicited-icmp', deviceId: id, icmpType: p.icmpType! } });
      return stop('arrived-no-reply');
    }
    if (host.ignoreIcmpEcho) {
      ctx.steps.push({ stage: 'host', at: id, verdict: 'drop', reason: { code: 'host-ignores-echo', deviceId: id } });
      return stop('arrived-no-reply');
    }
    ctx.steps.push({ stage: 'host', at: id, verdict: 'pass', reason: receiver.replies });
    return CONTINUE;
  }

  const port = p.port!;
  const lookup = lookupService(host.services, p.protocol, port, destinationIp);
  if (lookup === 'accepts') {
    ctx.steps.push({ stage: 'host', at: id, verdict: 'pass', reason: { code: 'host-accepts', deviceId: id, port } });
    return CONTINUE;
  }
  const reason: Reason = lookup === 'closed' ? { code: CLOSED_PORT_CODE[p.protocol], deviceId: id, port } : { code: 'host-wrong-address', deviceId: id, port, ip: destinationIp };
  return p.protocol === 'tcp' ? refuseTcp(ctx, receiver, port, reason) : rejectUdp(ctx, receiver, port, reason);
};
