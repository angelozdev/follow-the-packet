import { isNatPublicIp, publicIpOf, translateDestination, translateSource, type InboundTarget, type PublicEnd } from '@/engine/nat/translation';
import type { Router } from '@/engine/network/types';
import { sourcePortOf, type SimContext } from '@/engine/simulation/context';

/** Translates the source of the packet when the router sends it out of the office by its interface that faces `faces` (the router or the server next on the road). The packet must come from a device of the office and the router must face a LAN and have a public IP on that interface; the link to another office has a private one, so nothing is translated there. It happens once per trip (a loop that crosses the uplink again keeps the first translation) and writes no step, reason, hop or leg: the result is `ctx.translation`, the row (when there is one) goes into `ctx.nat`, and the header and the source of the trip stay as the sender sent them. The public ports of the router's port forwards are never handed to a row. */
export function translateOnExit(ctx: SimContext, router: Router, faces: string): void {
  const { net, source, packet } = ctx;
  const publicIp = publicIpOf(net, router, faces);
  if (!source.device || publicIp === undefined || ctx.translation) return;
  const reserved = (router.forwards ?? []).map(({ publicPort }) => publicPort);
  const translated = translateSource(ctx.nat, { protocol: packet.protocol, ip: source.ip, port: sourcePortOf(packet) }, publicIp, reserved);
  ctx.nat = translated.table;
  ctx.translation = translated.translation;
}

/** Returns the public end of the packet when this router is the NAT that a packet from outside meets: a TCP or UDP packet of a client actor, not yet delivered, for a public IP of a router that faces a LAN. Every other packet (an ICMP message, a packet of a device, one for any other IP of a router) is not the NAT's, and gets undefined. */
export function entersNat(ctx: SimContext, router: Router): PublicEnd | undefined {
  const { net, packet, source, delivered, destIp } = ctx;
  if (source.device || delivered || packet.protocol === 'icmp' || !isNatPublicIp(net, router, destIp!)) return undefined;
  return { protocol: packet.protocol, ip: destIp!, port: packet.port! };
}

/** Looks for what the router's NAT delivers a packet from outside to, among its port forwards and the rows of the table the sends before made (`ctx.nat`). When it finds it, the destination of the packet is translated: `ctx.translation` says how (with `fixed` for a forward), and `ctx.delivered` is the IP and port of the device, which is what the device and its firewall see; the header and the destination the sender wrote stay as they were. Writes no step. Returns undefined when nothing says where the packet goes. */
export function translateOnEntry(ctx: SimContext, router: Router, end: PublicEnd): InboundTarget | undefined {
  const delivery = translateDestination(ctx.net, router, ctx.nat, end);
  if (!delivery) return undefined;
  ctx.translation = { protocol: end.protocol, inside: delivery.inside, outside: { ip: end.ip, port: end.port }, isNew: false, fixed: delivery.fixed };
  ctx.delivered = { ip: delivery.device.privateIp, port: delivery.inside.port };
  return delivery;
}
