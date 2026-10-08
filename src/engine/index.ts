export { APP_TARGET, materialize } from './network/app-target';
export { applyAction, networkActionSchema } from './network/actions';
export type { NetworkAction } from './network/actions';
export type { Actor, Endpoint, Instance, Network, PacketSpec, Rule, RulePeer, RuleWhat, SecurityGroup, Subnet } from './network/types';
export { describePacket } from './simulation/context';
export { deathPoint } from './simulation/checkpoints';
export { simulate } from './simulation/simulate';
export type { Checkpoint, Outcome, Reason, Step, Trace } from './simulation/trace';
export { extraOpenings, reachesHost } from './exposure/exposure';
