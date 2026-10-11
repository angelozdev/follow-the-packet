import { hostsLine, hostsTrace } from '@/engine/dns/hosts';
import { resolve, type LookupMode, type Resolution, type SendPacket } from '@/engine/dns/resolve';
import { resolveName } from '@/engine/network/naming/dns';
import type { Device } from '@/engine/network/types';
import { CONTINUE, stop, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import type { Reason } from '@/engine/simulation/trace';

type Answered = Extract<Resolution, { answered: true }>;
type Unanswered = Extract<Resolution, { answered: false }>;

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

function answerStep(device: Device, resolution: Answered, ip: string): Reason {
  const { name, answers, fromCache, ttlLeft } = resolution.dns;
  const canonical = answers.filter((record) => record.type === 'CNAME').at(-1)?.value;
  const answer = { deviceId: device.id, resolverId: resolution.resolverId, name, ip, ...(canonical && { canonical }) };
  return fromCache && ttlLeft !== undefined ? { code: 'dns-cached', ...answer, ttlLeft } : { code: 'dns-answered', ...answer };
}

function followAnswer(ctx: SimContext, device: Device, resolution: Answered): StageResult {
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

/** Ends the lookup of a device that has a resolver and got no answer. With none set, it ends as it always did for an office, with `dns-unresolved` and nothing sent. Otherwise the question went out and one of two things happened: it reached a host that is no resolver (`dns-no-resolver`, which names that host), or it never reached one, because a firewall or a router dropped it or warned, or nobody has the IP (`dns-resolver-silent`). The warning that came back, if one did, is in `Resolution.query`. */
function failUnanswered(ctx: SimContext, device: Device, resolution: Unanswered): StageResult {
  if (device.dnsServer === undefined) return fail(ctx, { code: 'dns-unresolved', name: ctx.packet.to, fromInside: true });
  const asked = { deviceId: device.id, name: ctx.packet.to, ip: device.dnsServer };
  return fail(ctx, resolution.notAResolver ? { code: 'dns-no-resolver', ...asked, hostId: resolution.notAResolver } : { code: 'dns-resolver-silent', ...asked });
}

/** A device of an office asks the resolver of its network settings. Whatever a resolver answers is stored at the resolver, also when the question was made by a `ping` or an `nc`: the cache goes on with the send. */
function askResolver(ctx: SimContext, device: Device, send: SendPacket, mode: LookupMode): StageResult {
  const resolution = resolve(ctx.net, device, ctx.packet.to, mode, send, { now: ctx.now, cache: ctx.dnsCache });
  ctx.dns = resolution.dns;
  if (!resolution.answered) return failUnanswered(ctx, device, resolution);
  ctx.dnsCache = resolution.cache;
  return followAnswer(ctx, device, resolution);
}

/** The system reads the hosts file before it asks anybody: a line for the name answers it, no question is sent and no resolver stores anything. */
function readHostsFile(ctx: SimContext, device: Device, ip: string): StageResult {
  const name = ctx.packet.to;
  ctx.dns = hostsTrace(name);
  ctx.destIp = ip;
  ctx.steps.push({ stage: 'dns', at: device.id, verdict: 'info', reason: { code: 'dns-hosts-file', deviceId: device.id, name, ip } });
  return CONTINUE;
}

/** A `dig` is the question itself: it reads no hosts file and its destination is the resolver, so the datagram goes there like any packet and the pipeline takes the answer once it has been there (`asking`). With no resolver set there is nowhere to send it, and it ends as any lookup with none. */
function askAsDig(ctx: SimContext, device: Device, send: SendPacket): StageResult {
  if (device.dnsServer === undefined) return askResolver(ctx, device, send, 'dig');
  ctx.destIp = device.dnsServer;
  ctx.asking = ctx.packet.to;
  return CONTINUE;
}

/** Builds the stage that turns a name into an IP; it takes `send` to carry the question to the resolver as a packet, so the stage does not import the pipeline that contains it. A device of an office looks the name up like the system does (`ping`, `nc`): the hosts file first and then its resolver (`askResolver`); a `dig` goes straight to the resolver (`askAsDig`). Every other sender, in a VPC or on the internet, resolves EC2 names as it always did. A destination that is already an IP passes with no step. */
export function createDnsStage(send: SendPacket): Stage {
  return (ctx) => {
    if (ctx.destIp !== undefined) return CONTINUE;
    const { source, net, packet } = ctx;
    if (!source.device || net.kind !== 'office') return lookUpEc2Name(ctx);
    if (packet.lookup === 'dig') return askAsDig(ctx, source.device, send);
    const line = hostsLine(source.device, packet.to);
    return line ? readHostsFile(ctx, source.device, line.ip) : askResolver(ctx, source.device, send, 'system');
  };
}
