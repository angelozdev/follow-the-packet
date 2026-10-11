import type { FirewallKind, IcmpType } from '@/engine/network/types';

export type StepStage = 'address' | 'dns' | 'route' | 'nat' | 'firewall-out' | 'forward' | 'firewall-in' | 'host' | 'reply';
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
  | { code: 'host-udp-no-service'; deviceId: string; port: number }
  | { code: 'reply-stateful'; deviceId: string };

export const OUTCOMES = ['replied', 'timeout', 'refused', 'arrived-no-reply', 'unresolved', 'invalid-address', 'no-route', 'unreachable', 'ttl-exceeded', 'lost'] as const;

export type Outcome = (typeof OUTCOMES)[number];

export type NoticeKind = 'host-unreachable' | 'net-unreachable' | 'time-exceeded';

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

export interface TcpdumpLine {
  deviceId: string;
  direction: 'In' | 'Out';
  src: string;
  dst: string;
  summary: string;
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
  rttMs?: number;
}
