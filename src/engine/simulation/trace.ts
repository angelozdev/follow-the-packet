import type { IcmpType } from '@/engine/network/types';

export type StepStage = 'dns' | 'route' | 'nat' | 'sg-out' | 'sg-in' | 'linux' | 'reply';
export type Verdict = 'pass' | 'drop' | 'reject' | 'info';
export type CheckpointStage = Exclude<StepStage, 'nat'>;

export interface Checkpoint {
  stage: CheckpointStage;
  at: string;
}

export interface RuleCheck {
  sgId: string;
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
  | { code: 'route-no-public-instance'; ip: string }
  | { code: 'route-no-public-ip'; instanceId: string }
  | { code: 'route-nat'; from: string; to: string }
  | { code: 'route-from-internet' }
  | { code: 'sg-out-pass'; instanceId: string }
  | { code: 'sg-out-drop'; instanceId: string }
  | { code: 'sg-in-pass'; instanceId: string }
  | { code: 'sg-in-drop'; instanceId: string }
  | { code: 'linux-unsolicited-icmp'; instanceId: string; icmpType: IcmpType }
  | { code: 'linux-ignores-echo'; instanceId: string }
  | { code: 'linux-replies'; instanceId: string }
  | { code: 'linux-refused'; instanceId: string; port: number }
  | { code: 'linux-accepts'; instanceId: string; port: number }
  | { code: 'linux-udp-no-service'; instanceId: string; port: number }
  | { code: 'reply-stateful'; instanceId: string };

export type Outcome = 'replied' | 'timeout' | 'refused' | 'arrived-no-reply' | 'unresolved';

export interface TcpdumpLine {
  instanceId: string;
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
