import { isPrivateIpv4 } from '@/engine/network/addressing/cidr';
import { facesALan, interfaceTowards } from '@/engine/network/addressing/routing';
import type { Network, PacketSpec, Router } from '@/engine/network/types';

/** The first public port the table hands out. It is a number of the game: other NAT choose other numbers, and the example of RFC 3022 §2 also changes the port (3017 to 1024). */
export const FIRST_PUBLIC_PORT = 40001;

type Transport = Exclude<PacketSpec['protocol'], 'icmp'>;

/** One end of a translation: an IP and, for TCP and UDP, a port. */
export interface TranslatedEnd {
  ip: string;
  port?: number;
}

/** What the NAT did with the source of a packet: the end it left the device with (`inside`), the end it leaves the office with (`outside`), whether this packet made the row, and whether the row is a fixed one (a port forward). An ICMP message is translated too, but has no ports and leaves no row. */
export interface Translation {
  protocol: PacketSpec['protocol'];
  inside: TranslatedEnd;
  outside: TranslatedEnd;
  isNew: boolean;
  fixed: boolean;
}

/** A row of the translation table: the private end of a TCP or UDP exchange and the public one it leaves as. */
export interface NatRow {
  protocol: Transport;
  inside: Required<TranslatedEnd>;
  outside: Required<TranslatedEnd>;
}

/** The translation table of the NAT of the office, in the order its rows were made. */
export type NatTable = readonly NatRow[];

/** The source of a packet as the device sent it: its protocol, its private IP and the port it leaves from (an ICMP message has none and the port is ignored). */
export interface TranslatedSource {
  protocol: PacketSpec['protocol'];
  ip: string;
  port: number;
}

/** Returns the IP a router translates to when it forwards a packet through its interface that faces `faces`: that interface's IP, when the router faces a LAN (it is the edge of the office) and the IP is not private (RFC 1918). The link to another office has a private IP, so it is not translated. */
export function publicIpOf(net: Network, router: Router, faces: string): string | undefined {
  const ip = interfaceTowards(router, faces);
  return ip !== undefined && facesALan(net, router) && !isPrivateIpv4(ip) ? ip : undefined;
}

function nextFreePort(table: NatTable): number {
  const used = new Set(table.map((row) => row.outside.port));
  let port = FIRST_PUBLIC_PORT;
  while (used.has(port)) port += 1;
  return port;
}

function rowOf(table: NatTable, { protocol, ip, port }: TranslatedSource, publicIp: string): NatRow | undefined {
  return table.find((row) => row.protocol === protocol && row.inside.ip === ip && row.inside.port === port && row.outside.ip === publicIp);
}

/** Translates the source of a packet that leaves the office by an interface with the IP `publicIp`. An ICMP message is translated to the public IP with no ports and no row. For TCP and UDP the same private IP and port reuse their row whatever the destination (an endpoint-independent mapping, RFC 5382 REQ-1 and RFC 4787 REQ-1); a new one gets the next free public port from `FIRST_PUBLIC_PORT`, whatever the protocol. Returns the translation and the table after it, which is the same table when the row already existed or the packet was ICMP; the table it receives is never changed. */
export function translateSource(table: NatTable, source: TranslatedSource, publicIp: string): { translation: Translation; table: NatTable } {
  const { protocol, ip, port } = source;
  if (protocol === 'icmp') return { table, translation: { protocol, inside: { ip }, outside: { ip: publicIp }, isNew: false, fixed: false } };
  const known = rowOf(table, source, publicIp);
  const row: NatRow = known ?? { protocol, inside: { ip, port }, outside: { ip: publicIp, port: nextFreePort(table) } };
  return { table: known ? table : [...table, row], translation: { protocol, inside: { ...row.inside }, outside: { ...row.outside }, isNew: known === undefined, fixed: false } };
}
