import type { Translation } from '@/engine/nat/translation';
import type { RouteDecision } from '@/engine/network/addressing/routing-table';
import type { AnswerRecord, FirewallKind, IcmpType, PacketSpec, Service, SoaRecord } from '@/engine/network/types';
import type { AppRequest, AppResponse } from '@/engine/web/messages';

export type StepStage = 'address' | 'dns' | 'route' | 'nat' | 'firewall-out' | 'forward' | 'firewall-in' | 'host' | 'app' | 'reply';
export type Verdict = 'pass' | 'drop' | 'reject' | 'info';
export type CheckpointStage = Exclude<StepStage, 'nat'>;

export interface Checkpoint {
  stage: CheckpointStage;
  at: string;
}

export interface RuleCheck {
  firewallId: string;
  ruleId: string;
  what: boolean;
  from: boolean;
}

export interface Step {
  stage: StepStage;
  at: string;
  verdict: Verdict;
  reason: Reason;
  checks?: RuleCheck[];
}

export type Reason =
  | { code: 'address-invalid'; address: string }
  | { code: 'address-localhost'; ip: string }
  | { code: 'dns-unresolved'; name: string; fromInside: boolean }
  | { code: 'dns-resolved'; name: string; ip: string; fromInside: boolean }
  | { code: 'dns-answered'; deviceId: string; resolverId: string; name: string; ip: string; canonical?: string }
  | { code: 'dns-cached'; deviceId: string; resolverId: string; name: string; ip: string; ttlLeft: number; canonical?: string }
  | { code: 'dns-hosts-file'; deviceId: string; name: string; ip: string }
  | { code: 'dns-nxdomain'; deviceId: string; resolverId: string; name: string }
  | { code: 'dns-servfail'; deviceId: string; resolverId: string; name: string; serverId?: string }
  | { code: 'dns-no-address'; deviceId: string; resolverId: string; name: string }
  | { code: 'dns-no-resolver'; deviceId: string; name: string; ip: string; hostId: string }
  | { code: 'dns-resolver-silent'; deviceId: string; name: string; ip: string }
  | { code: 'route-private-from-outside'; ip: string }
  | { code: 'route-no-device'; ip: string }
  | { code: 'route-private' }
  | { code: 'route-no-public-device'; ip: string }
  | { code: 'route-no-public-ip'; deviceId: string }
  | { code: 'route-nat'; from: string; to: string }
  | { code: 'route-from-internet' }
  | { code: 'route-self'; deviceId: string }
  | { code: 'route-loopback'; deviceId: string; ip: string }
  | { code: 'route-no-gateway'; deviceId: string; ip: string }
  | { code: 'route-not-connected'; deviceId: string }
  | { code: 'route-gateway-not-a-router'; deviceId: string; ip: string }
  | { code: 'route-leaves-office'; ip: string }
  | { code: 'forward-no-owner'; deviceId: string; ip: string; viaGateway: boolean }
  | { code: 'forward-hop'; routerId: string; ip: string; ttlLeft: number }
  | { code: 'forward-ttl-exceeded'; routerId: string; ip: string }
  | { code: 'forward-no-route'; routerId: string; ip: string; warns: boolean }
  | { code: 'forward-no-host'; routerId: string; ip: string; warns: boolean }
  | { code: 'forward-private-dropped'; routerId: string; ip: string }
  | { code: 'forward-router-replies'; routerId: string; ip: string }
  | { code: 'nat-no-translation'; routerId: string; protocol: Service['protocol']; ip: string; port: number }
  | { code: 'nat-forwarded'; routerId: string; deviceId: string; protocol: Service['protocol']; ip: string; port: number; toPort: number; fixed: boolean }
  | { code: 'firewall-out-pass'; deviceId: string; firewallKind: FirewallKind }
  | { code: 'firewall-out-drop'; deviceId: string; firewallKind: FirewallKind }
  | { code: 'firewall-in-pass'; deviceId: string; firewallKind: FirewallKind }
  | { code: 'firewall-in-drop'; deviceId: string; firewallKind: FirewallKind }
  | { code: 'host-unsolicited-icmp'; deviceId: string; icmpType: IcmpType }
  | { code: 'host-ignores-echo'; deviceId: string }
  | { code: 'host-replies'; deviceId: string }
  | { code: 'host-refused'; deviceId: string; port: number }
  | { code: 'host-wrong-address'; deviceId: string; port: number; ip: string }
  | { code: 'host-accepts'; deviceId: string; port: number }
  | { code: 'process-stopped'; deviceId: string; port: number }
  | { code: 'host-udp-closed'; deviceId: string; port: number }
  | { code: 'web-site-chosen'; deviceId: string; name: string }
  | { code: 'web-default-site'; deviceId: string; name: string }
  | { code: 'web-needs-login'; deviceId: string; path: string }
  | { code: 'web-forbidden'; deviceId: string; path: string; user: string }
  | { code: 'web-answered'; deviceId: string; statusCode: number }
  | { code: 'reply-stateful'; deviceId: string };

export const OUTCOMES = ['replied', 'timeout', 'refused', 'arrived-no-reply', 'unresolved', 'invalid-address', 'no-route', 'unreachable', 'ttl-exceeded', 'lost'] as const;

export type Outcome = (typeof OUTCOMES)[number];

export type NoticeKind = 'host-unreachable' | 'net-unreachable' | 'time-exceeded' | 'port-unreachable';

/** The warning that came back to the sender: what it says, who generated it and from which IP. */
export interface Notice {
  kind: NoticeKind;
  fromId: string;
  fromIp: string;
}

/** A router that took the packet: the IP of its interface towards the sender and the TTL the packet had left after it. */
export interface Hop {
  routerId: string;
  ip: string;
  ttlLeft: number;
}

/** The ports a TCP or UDP packet carries; ICMP has none. */
export interface PortPair {
  sourcePort: number;
  destinationPort: number;
}

/** The addresses a packet carries: who sent it, who it is for and the TTL it left with; a TCP or UDP packet also carries its two ports. The reply swaps source and destination (RFC 792), and with them the ports. */
export interface PacketHeader {
  request: { source: string; destination: string; ttl: number } & Partial<PortPair>;
  reply?: { source: string; destination: string } & Partial<PortPair>;
}

export type ExchangeKind = 'SYN' | 'SYN-ACK' | 'ACK' | 'RST' | 'query' | 'response';

/** One thing an end of a TCP or UDP exchange said to the other: the client is who sent the packet and the server is who it was for. */
export interface ExchangeMessage {
  from: 'client' | 'server';
  kind: ExchangeKind;
}

export const DNS_STATUSES = ['NOERROR', 'NXDOMAIN', 'SERVFAIL', 'NO-RESOLVER'] as const;

/** What came back for a name: the status of the answer (`NOERROR` also covers a name that exists and has no address, whose `answers` hold no A record) or `NO-RESOLVER` when nobody answered the question. */
export type DnsStatus = (typeof DNS_STATUSES)[number];

/** What happened to a name a packet was sent to. `answers` are the records of the answer in order, the aliases first and the addresses after them, each with its TTL (the seconds it has left, when the answer came from the cache); `fromCache` says the resolver answered from its cache and then `ttlLeft` is the seconds the answer has left, those of the record that expires first, and it is absent from every other trace; `usedHostsFile` says the hosts file of the device answered and nothing was asked, so `answers` is empty and the address is the `resolvedIp` of the trace; `viaDig` says the lookup was a `dig`, which is also what the question of a lookup by name carries in `Trace.question` (the trace of that datagram is the one of a `dig`). `soa` is the SOA of the zone that gave a negative answer (a name that does not exist, or one that exists and holds no address), with the TTL of that answer, the smaller of the SOA's own and its MINIMUM (RFC 2308 §3), and is absent from every other status. */
export interface DnsTrace {
  name: string;
  status: DnsStatus;
  answers: AnswerRecord[];
  soa?: SoaRecord;
  fromCache: boolean;
  ttlLeft?: number;
  usedHostsFile: boolean;
  viaDig: boolean;
}

export interface TcpdumpLine {
  deviceId: string;
  direction: 'In' | 'Out';
  src: string;
  dst: string;
  summary: string;
}

/** The question a send by name put to its resolver before the packet itself: the UDP datagram to port 53 as it left, with the source port it took, and its whole trace (the header with ports, the exchange of query and answer, the row of the translation table, the hops and the warning, and `dns` as a `dig` carries it). The packet that asked has no step, hop or leg of it. */
export interface Question {
  packet: PacketSpec;
  trace: Trace;
}

/** What happened to the message of a packet: the request it makes, built from the message alone whether or not the connection opened, and the response, which exists only when a web service answered it. */
export interface GeneratedBy {
  id: string;
  role: 'app' | 'proxy';
}

export interface AppTrace {
  request: AppRequest;
  response?: AppResponse;
  generatedBy?: GeneratedBy;
  upstream?: Trace;
}

export interface Trace {
  steps: Step[];
  outcome: Outcome;
  resolvedIp: string | null;
  destinationId: string | null;
  effectiveSource: string;
  tcpdump: TcpdumpLine[];
  notice?: Notice;
  hops?: Hop[];
  header?: PacketHeader;
  exchange?: ExchangeMessage[];
  routes?: RouteDecision[];
  translation?: Translation;
  dns?: DnsTrace;
  question?: Question;
  app?: AppTrace;
  rttMs?: number;
}
