import { resolve, type Resolution, type SendPacket } from '@/engine/dns/resolve';
import { resolveName } from '@/engine/network/naming/dns';
import type { Device } from '@/engine/network/types';
import { CONTINUE, stop, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import type { Reason } from '@/engine/simulation/trace';

function lookUpEc2Name(ctx: SimContext): StageResult {
  const { packet, source, net } = ctx;
  const ip = resolveName(net, packet.to, source.inside);
  if (ip === null) return fail(ctx, { code: 'dns-unresolved', name: packet.to, fromInside: source.inside });
  ctx.destIp = ip;
  ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'info', reason: { code: 'dns-resolved', name: packet.to, ip, fromInside: source.inside } });
  return CONTINUE;
}

function fail(ctx: SimContext, reason: Reason): StageResult {
  ctx.steps.push({ stage: 'dns', at: ctx.source.id, verdict: 'drop', reason });
  return stop('unresolved');
}

function answerStep(device: Device, resolution: Extract<Resolution, { answered: true }>, ip: string): Reason {
  const { name, answers } = resolution.dns;
  const canonical = answers.filter((record) => record.type === 'CNAME').at(-1)?.value;
  return { code: 'dns-answered', deviceId: device.id, resolverId: resolution.resolverId, name, ip, ...(canonical && { canonical }) };
}

function followAnswer(ctx: SimContext, device: Device, resolution: Extract<Resolution, { answered: true }>): StageResult {
  const { name, status, answers } = resolution.dns;
  const where = { deviceId: device.id, resolverId: resolution.resolverId, name };
  if (status === 'NXDOMAIN') return fail(ctx, { code: 'dns-nxdomain', ...where });
  if (status === 'SERVFAIL') return fail(ctx, { code: 'dns-servfail', ...where, ...(resolution.serverId && { serverId: resolution.serverId }) });
  const address = answers.find((record) => record.type === 'A');
  if (!address) return fail(ctx, { code: 'dns-no-address', ...where });
  ctx.destIp = address.value;
  ctx.steps.push({ stage: 'dns', at: device.id, verdict: 'info', reason: answerStep(device, resolution, address.value) });
  return CONTINUE;
}

/** A device of an office asks the resolver of its network settings. With no `dnsServer` the lookup ends as it always did for an office, with `dns-unresolved` and nothing sent; the field `Trace.dns` says why, `NO-RESOLVER`. */
function askResolver(ctx: SimContext, device: Device, send: SendPacket): StageResult {
  const resolution = resolve(ctx.net, device, ctx.packet.to, 'system', send);
  ctx.dns = resolution.dns;
  if (resolution.answered) return followAnswer(ctx, device, resolution);
  if (device.dnsServer === undefined) return fail(ctx, { code: 'dns-unresolved', name: ctx.packet.to, fromInside: true });
  return fail(ctx, { code: 'dns-no-resolver', deviceId: device.id, name: ctx.packet.to, ip: device.dnsServer });
}

/** Builds the stage that turns a name into an IP; it takes `send` to carry the question to the resolver as a packet, so the stage does not import the pipeline that contains it. A device of an office asks its resolver (`askResolver`); every other sender, in a VPC or on the internet, resolves EC2 names as it always did. A destination that is already an IP passes with no step. */
export function createDnsStage(send: SendPacket): Stage {
  return (ctx) => {
    if (ctx.destIp !== undefined) return CONTINUE;
    const { source, net } = ctx;
    return source.device && net.kind === 'office' ? askResolver(ctx, source.device, send) : lookUpEc2Name(ctx);
  };
}
