import type { IcmpType } from '@/engine/network/types';

export type StepStage = 'dns' | 'route' | 'nat' | 'firewall-out' | 'firewall-in' | 'host' | 'reply';
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
  | { code: 'dns-unresolved'; name: string; fromInside: boolean }
  | { code: 'dns-resolved'; name: string; ip: string; fromInside: boolean }
  | { code: 'route-private-from-outside'; ip: string }
  | { code: 'route-no-private-instance'; ip: string }
  | { code: 'route-private' }
  | { code: 'route-no-public-device'; ip: string }
  | { code: 'route-no-public-ip'; deviceId: string }
  | { code: 'route-nat'; from: string; to: string }
  | { code: 'route-from-internet' }
  | { code: 'firewall-out-pass'; deviceId: string }
  | { code: 'firewall-out-drop'; deviceId: string }
  | { code: 'firewall-in-pass'; deviceId: string }
  | { code: 'firewall-in-drop'; deviceId: string }
  | { code: 'host-unsolicited-icmp'; deviceId: string; icmpType: IcmpType }
  | { code: 'host-ignores-echo'; deviceId: string }
  | { code: 'host-replies'; deviceId: string }
  | { code: 'host-refused'; deviceId: string; port: number }
  | { code: 'host-accepts'; deviceId: string; port: number }
  | { code: 'host-udp-no-service'; deviceId: string; port: number }
  | { code: 'reply-stateful'; deviceId: string };

export type Outcome = 'replied' | 'timeout' | 'refused' | 'arrived-no-reply' | 'unresolved';

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
}
