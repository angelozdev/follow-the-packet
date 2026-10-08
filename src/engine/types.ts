import type { z } from 'zod';
import type {
  actorSchema,
  checkpointSchema,
  endpointSchema,
  instanceSchema,
  networkSchema,
  packetSchema,
  rulePeerSchema,
  ruleSchema,
  ruleWhatSchema,
  securityGroupSchema,
  subnetSchema,
} from './schema';

export type RuleWhat = z.infer<typeof ruleWhatSchema>;
export type RulePeer = z.infer<typeof rulePeerSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type SecurityGroup = z.infer<typeof securityGroupSchema>;
export type Instance = z.infer<typeof instanceSchema>;
export type Subnet = z.infer<typeof subnetSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type Network = z.infer<typeof networkSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type PacketSpec = z.infer<typeof packetSchema>;
export type Checkpoint = z.infer<typeof checkpointSchema>;

export type StepStage = 'dns' | 'route' | 'nat' | 'sg-out' | 'sg-in' | 'linux' | 'reply';
export type Verdict = 'pass' | 'drop' | 'reject' | 'info';

export interface RuleCheck {
  sgId: string;
  ruleId: string;
  what: boolean;
  from: boolean;
}

export interface Step {
  stage: StepStage;
  /** Pieza del mapa: id de instancia o actor, "igw" o "vpc". */
  at: string;
  verdict: Verdict;
  reason: string;
  checks?: RuleCheck[];
}

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
  /** IP de origen que ve el destino (cambia con NAT). */
  effectiveSource: string;
  tcpdump: TcpdumpLine[];
}
