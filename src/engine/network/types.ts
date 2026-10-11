import type { z } from 'zod';
import type {
  actorSchema,
  deviceSchema,
  directionSchema,
  dnsCacheEntrySchema,
  dnsRecordSchema,
  dnsSchema,
  endpointSchema,
  firewallSchema,
  forwardSchema,
  hostLineSchema,
  icmpTypeSchema,
  lanSchema,
  lookupSchema,
  networkSchema,
  packetSchema,
  routeSchema,
  routerInterfaceSchema,
  routerSchema,
  rulePeerSchema,
  ruleSchema,
  ruleWhatSchema,
  serviceSchema,
  soaSchema,
  subnetSchema,
  zoneSchema,
} from './schema';

export type RuleWhat = z.infer<typeof ruleWhatSchema>;
export type RulePeer = z.infer<typeof rulePeerSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type Firewall = z.infer<typeof firewallSchema>;
export type FirewallKind = Firewall['kind'];
export type Service = z.infer<typeof serviceSchema>;
export type HostLine = z.infer<typeof hostLineSchema>;
export type LookupMode = z.infer<typeof lookupSchema>;
export type Device = z.infer<typeof deviceSchema>;
export type DnsRecord = z.infer<typeof dnsRecordSchema>;
export type SoaRecord = Extract<DnsRecord, { type: 'SOA' }>;
export type Soa = z.infer<typeof soaSchema>;
export type AnswerRecord = Extract<DnsRecord, { type: 'A' | 'CNAME' }>;
export type Zone = z.infer<typeof zoneSchema>;
export type DnsCacheEntry = z.infer<typeof dnsCacheEntrySchema>;
export type ServerDns = z.infer<typeof dnsSchema>;
export type Subnet = z.infer<typeof subnetSchema>;
export type Direction = z.infer<typeof directionSchema>;
export type Lan = z.infer<typeof lanSchema>;
export type RouterInterface = z.infer<typeof routerInterfaceSchema>;
export type Route = z.infer<typeof routeSchema>;
export type Forward = z.infer<typeof forwardSchema>;
export type Router = z.infer<typeof routerSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type ServerActor = Extract<Actor, { kind: 'server' }>;
export type ClientActor = Exclude<Actor, ServerActor>;
export type Network = z.infer<typeof networkSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type PacketSpec = z.infer<typeof packetSchema>;
export type IcmpType = z.infer<typeof icmpTypeSchema>;
