import compare from 'just-compare';
import { DEFAULT_DIRECTION, ipInCidr, isIpv4, type Direction, type Network, type PacketSpec, type Rule } from '@/engine';
import { peerIdOf, ruleIdFor, type AddressChip, type FromChip, type Incident, type MessageChip, type OriginChip, type PlaceMove, type SendChips, type SendMove, type ToChip, type WhatChip } from './incident';

type RuleShape = Pick<Rule, 'what' | 'peer'>;
type Combination = Omit<SendMove, 'type'>;

/** Whatever offers send chips: a send incident, or a case of a diagnose incident. */
export interface SendOwner {
  send: SendChips;
}

/** True when two rules allow the same thing from the same place, whatever their ids. */
export function sameRule(a: RuleShape, b: RuleShape): boolean {
  return compare(a.what, b.what) && compare(a.peer, b.peer);
}

function peerChipsOf(incident: Incident, direction: Direction): FromChip[] | ToChip[] {
  if (incident.mechanic !== 'filter') return [];
  return direction === 'outbound' ? (incident.chips.to ?? []) : incident.chips.from;
}

/** Builds the rule a placement of the incident's chips stands for (Type and Source for an inbound rule, Type and Destination for an outbound one), or null when the incident offers no rule chips or not these. */
export function ruleFromChips(incident: Incident, move: Pick<PlaceMove, 'whatId' | 'direction' | 'fromId' | 'toId'>): Rule | null {
  if (incident.mechanic !== 'filter') return null;
  const direction = move.direction ?? DEFAULT_DIRECTION;
  const peerId = peerIdOf(move);
  const what = incident.chips.what.find((chip) => chip.id === move.whatId);
  const peer = peerChipsOf(incident, direction).find((chip) => chip.id === peerId);
  return what && peer ? { id: ruleIdFor(move.whatId, peer.id, direction), what: what.what, peer: peer.peer } : null;
}

/** Returns the chips that name a rule of the list of its direction (inbound by default), or null when the incident offers no rule chips or none for its what or its peer. */
export function chipsOfRule(incident: Incident, rule: RuleShape, direction: Direction = DEFAULT_DIRECTION): { what: WhatChip; peer: FromChip | ToChip } | null {
  if (incident.mechanic !== 'filter') return null;
  const what = incident.chips.what.find((chip) => compare(chip.what, rule.what));
  const peer = peerChipsOf(incident, direction).find((chip) => compare(chip.peer, rule.peer));
  return what && peer ? { what, peer } : null;
}

interface PickedChips {
  from: OriginChip;
  to: AddressChip;
  message: MessageChip;
}

function pickedChips(incident: SendOwner, { fromId, toId, messageId }: Combination): PickedChips | null {
  const from = incident.send.from.find((chip) => chip.id === fromId);
  const to = incident.send.to.find((chip) => chip.id === toId);
  const message = incident.send.message.find((chip) => chip.id === messageId);
  return from && to && message ? { from, to, message } : null;
}

function icmpPacket({ from, to, message }: PickedChips): PacketSpec {
  return { from: from.endpoint, to: to.address, protocol: 'icmp', icmpType: message.icmpType };
}

/** Builds the packet three send chips stand for: an ICMP message from the origin to the address, with the TTL of the message chip when it has one; null when the incident does not offer one of them, and null for a traceroute, which sends a packet per hop and not a single one. */
export function packetFromChips(incident: SendOwner, combination: Combination): PacketSpec | null {
  const picked = pickedChips(incident, combination);
  if (!picked || picked.message.command === 'traceroute') return null;
  return picked.message.ttl === undefined ? icmpPacket(picked) : { ...icmpPacket(picked), ttl: picked.message.ttl };
}

/** Builds the Echo Request that a traceroute repeats with a growing TTL, from the origin to the address; null unless the message chip is a traceroute the incident offers with these two chips. */
export function probeFromChips(incident: SendOwner, combination: Combination): PacketSpec | null {
  const picked = pickedChips(incident, combination);
  return picked?.message.command === 'traceroute' ? icmpPacket(picked) : null;
}

/** Returns every combination of the incident's send chips, one origin, one address and one message each. */
export function sendCombinations(incident: SendOwner): Combination[] {
  return incident.send.from.flatMap((from) =>
    incident.send.to.flatMap((to) => incident.send.message.map((message) => ({ fromId: from.id, toId: to.id, messageId: message.id }))),
  );
}

function sendPacketsOf(owner: SendOwner): PacketSpec[] {
  return sendCombinations(owner).flatMap((combination) => packetFromChips(owner, combination) ?? probeFromChips(owner, combination) ?? []);
}

function sendOwnersOf(incident: Incident): SendOwner[] {
  switch (incident.mechanic) {
    case 'send':
      return [incident];
    case 'diagnose':
      return incident.diagnose.cases;
    default:
      return [];
  }
}

function packetsOf(incident: Incident): PacketSpec[] {
  return [...incident.flows.map((flow) => flow.packet), ...sendOwnersOf(incident).flatMap(sendPacketsOf)];
}

/** Returns, as "device → address", every flow and every combination of send chips (of every case, in a diagnose incident) (a traceroute through its probe) that sends a packet from a device of an office to an address outside it: the game does not model the office's NAT. An office with routers has a modelled way out, so it has no leaks. */
export function officeLeaks(incident: Incident, world: Network): string[] {
  if (world.kind !== 'office' || (world.routers ?? []).length > 0) return [];
  return packetsOf(incident)
    .filter((packet) => packet.from.kind === 'device' && isIpv4(packet.to) && !ipInCidr(packet.to, world.cidr))
    .map((packet) => `${packet.from.id} → ${packet.to}`);
}

function placedIds(world: Network): string[] {
  return [...world.devices, ...(world.routers ?? []), ...world.actors].map((thing) => thing.id);
}

/** Returns, in the order of the tasks, the ids that a send incident expects to answer, warn or drop (`expect.by`) and that name no device, router, actor or firewall of the world. */
export function unknownExpectedIds(incident: Incident, world: Network): string[] {
  if (incident.mechanic !== 'send') return [];
  const known = new Set([...placedIds(world), ...world.firewalls.map((firewall) => firewall.id)]);
  return incident.tasks.flatMap(({ expect }) => (expect.by !== undefined && !known.has(expect.by) ? [expect.by] : []));
}

/** Returns the ids in the list of shown pieces of an incident that name no device, router or actor of the world: a firewall is drawn with its device and is not listed by itself. An incident with no list draws the whole world, so it has none. */
export function unknownShownIds(incident: Incident, world: Network): string[] {
  const placed = new Set(placedIds(world));
  return (incident.shown ?? []).filter((id) => !placed.has(id));
}

/** Returns the ids of the devices whose card an identify incident offers, in the order of its cards; none for any other incident. */
export function cardDeviceIds(incident: Incident): string[] {
  return incident.mechanic === 'identify' ? incident.identify.cards.map((card) => card.deviceId) : [];
}

/** Returns the ids of the cards of an identify incident that name no device of the world, in the order of its cards. */
export function unknownCardDeviceIds(incident: Incident, world: Network): string[] {
  const devices = new Set(world.devices.map((device) => device.id));
  return cardDeviceIds(incident).filter((deviceId) => !devices.has(deviceId));
}

function sendersOf(incident: Incident): string[] {
  switch (incident.mechanic) {
    case 'send':
    case 'diagnose':
      return sendOwnersOf(incident).flatMap((owner) => owner.send.from.map((chip) => chip.endpoint.id));
    case 'identify':
      return cardDeviceIds(incident);
    case 'filter':
      return incident.flows.map((flow) => flow.packet.from.id);
  }
}

function addressesOf(incident: Incident): string[] {
  const owners = sendOwnersOf(incident);
  return owners.length > 0 ? owners.flatMap((owner) => owner.send.to.map((chip) => chip.address)) : incident.flows.map((flow) => flow.packet.to);
}

function expectedBy(incident: Incident): string[] {
  return incident.mechanic === 'send' ? incident.tasks.flatMap(({ expect }) => expect.by ?? []) : [];
}

function ownerOf(world: Network, address: string): string[] {
  const devices = world.devices.filter((device) => device.privateIp === address || device.publicIp === address);
  const routers = (world.routers ?? []).filter((router) => router.interfaces.some((face) => face.ip === address));
  const actors = world.actors.filter((actor) => actor.ip === address);
  return [...devices, ...routers, ...actors].map((owner) => owner.id);
}

function drawnWith(world: Network, id: string): string {
  return world.devices.find((device) => device.firewallIds.includes(id))?.id ?? id;
}

/** Returns, in order, what the list of shown pieces of an incident must hold and lacks: the sender (or, in an identify incident, the device of every card; in a diagnose, the senders and the addresses of every case), the owner of every address it sends to (an address nobody has needs none) and whoever a task expects (a firewall is drawn with its device). An incident with no list draws the whole world, so it lacks nothing. */
export function missingShownIds(incident: Incident, world: Network): string[] {
  if (!incident.shown) return [];
  const shown = new Set(incident.shown);
  const needed = [...sendersOf(incident), ...addressesOf(incident).flatMap((address) => ownerOf(world, address)), ...expectedBy(incident).map((id) => drawnWith(world, id))];
  return needed.filter((id, index) => !shown.has(id) && needed.indexOf(id) === index);
}
