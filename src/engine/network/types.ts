import type { z } from 'zod';
import type {
  actorSchema,
  deviceSchema,
  directionSchema,
  endpointSchema,
  firewallSchema,
  icmpTypeSchema,
  lanSchema,
  networkSchema,
  packetSchema,
  routeSchema,
  routerInterfaceSchema,
  routerSchema,
  rulePeerSchema,
  ruleSchema,
  ruleWhatSchema,
  subnetSchema,
} from './schema';

export type RuleWhat = z.infer<typeof ruleWhatSchema>;
export type RulePeer = z.infer<typeof rulePeerSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type Firewall = z.infer<typeof firewallSchema>;
export type FirewallKind = Firewall['kind'];
export type Device = z.infer<typeof deviceSchema>;
export type Subnet = z.infer<typeof subnetSchema>;
export type Direction = z.infer<typeof directionSchema>;
export type Lan = z.infer<typeof lanSchema>;
export type RouterInterface = z.infer<typeof routerInterfaceSchema>;
export type Route = z.infer<typeof routeSchema>;
export type Router = z.infer<typeof routerSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type ServerActor = Extract<Actor, { kind: 'server' }>;
export type ClientActor = Exclude<Actor, ServerActor>;
export type Network = z.infer<typeof networkSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type PacketSpec = z.infer<typeof packetSchema>;
export type IcmpType = z.infer<typeof icmpTypeSchema>;
