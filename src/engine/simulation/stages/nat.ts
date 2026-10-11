import { publicIpOf, translateSource } from '@/engine/nat/translation';
import type { Router } from '@/engine/network/types';
import { sourcePortOf, type SimContext } from '@/engine/simulation/context';

/** Translates the source of the packet when the router sends it out of the office by its interface that faces `faces` (the router or the server next on the road). The packet must come from a device of the office and the router must face a LAN and have a public IP on that interface; the link to another office has a private one, so nothing is translated there. It happens once per trip (a loop that crosses the uplink again keeps the first translation) and writes no step, reason, hop or leg: the result is `ctx.translation`, the row (when there is one) goes into `ctx.nat`, and the header and the source of the trip stay as the sender sent them. */
export function translateOnExit(ctx: SimContext, router: Router, faces: string): void {
  const { net, source, packet } = ctx;
  const publicIp = publicIpOf(net, router, faces);
  if (!source.device || publicIp === undefined || ctx.translation) return;
  const translated = translateSource(ctx.nat, { protocol: packet.protocol, ip: source.ip, port: sourcePortOf(packet) }, publicIp);
  ctx.nat = translated.table;
  ctx.translation = translated.translation;
}
