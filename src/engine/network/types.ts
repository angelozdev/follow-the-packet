import type { z } from 'zod';
import type {
  actorSchema,
  endpointSchema,
  icmpTypeSchema,
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
export type IcmpType = z.infer<typeof icmpTypeSchema>;
