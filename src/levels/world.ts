import { DEFAULT_DIRECTION, applyAction, listenSchema, recordProblem, routeProblem, type Device, type Network, type RecordProblem, type RouteProblem } from '@/engine';
import { ruleFromChips, sameRule } from './contract/chips';
import { settingKind, type CaseSpec, type Incident, type PlaceEntryMove, type PlayerMove, type RemoveEntryMove, type RuleMove, type SettingMove, type SettingSpec } from './contract/incident';
import { placementOf, removalOf, tableOf } from './contract/tables';

function findIncident(incidents: Incident[], incidentId: string): Incident {
  const found = incidents.find((i) => i.id === incidentId);
  if (!found) throw new Error(`unknown incident ${incidentId}`);
  return found;
}

/** Why the engine does not take an entry the player placed: a record code or a route code. */
export type EntryProblem = RecordProblem | RouteProblem;

function listenOf(device: Device, { protocol, port }: NonNullable<SettingSpec['service']>): string | undefined {
  return device.host.services.find((service) => service.protocol === protocol && service.port === port)?.listen;
}

/** Returns the value a setting has in the world now, the one the chip that matches the world carries: the default gateway or the DNS server of its device (null when it has none) or the listen address of the service it names (null when the device has no such service, or is not in the world). The session applies a setting by comparing with it, and the card of settings picks its chip by it, so the two cannot disagree. */
export function settingValue(world: Network, setting: SettingSpec): string | null {
  const device = world.devices.find((candidate) => candidate.id === setting.deviceId);
  switch (settingKind(setting)) {
    case 'gateway':
      return device?.gateway ?? null;
    case 'dns-server':
      return device?.dnsServer ?? null;
    case 'listen-address':
      return (device && setting.service && listenOf(device, setting.service)) || null;
  }
}

function applySetting(world: Network, incident: Incident, { deviceId, settingId, chipId }: SettingMove): Network {
  const setting = incident.mechanic === 'send' ? incident.send.settings?.find((candidate) => candidate.deviceId === deviceId && candidate.id === settingId) : undefined;
  const chip = setting?.chips.find((candidate) => candidate.id === chipId);
  if (!setting || !chip || !world.devices.some((candidate) => candidate.id === deviceId) || settingValue(world, setting) === chip.value) return world;
  switch (settingKind(setting)) {
    case 'gateway':
      return applyAction(world, { type: 'setGateway', deviceId, gateway: chip.value ?? undefined });
    case 'dns-server':
      return applyAction(world, { type: 'setDnsServer', deviceId, server: chip.value ?? undefined });
    case 'listen-address': {
      const listen = listenSchema.safeParse(chip.value);
      return setting.service && listen.success ? applyAction(world, { type: 'setListenAddress', ownerId: deviceId, ...setting.service, listen: listen.data }) : world;
    }
  }
}

function applyRule(world: Network, incident: Incident, move: RuleMove): Network {
  const firewall = world.firewalls.find((f) => f.id === move.firewallId);
  if (!firewall) return world;
  const direction = move.direction ?? DEFAULT_DIRECTION;
  if (move.type === 'removeRule') {
    return firewall[direction].some((r) => r.id === move.ruleId) ? applyAction(world, move) : world;
  }
  const rule = ruleFromChips(incident, move);
  if (!rule || firewall[direction].some((r) => sameRule(r, rule))) return world;
  return applyAction(world, { type: 'addRule', firewallId: move.firewallId, rule, direction });
}

function applyPlacement(world: Network, incident: Incident, { tableId, picks }: PlaceEntryMove): Network {
  const table = tableOf(incident, tableId);
  const action = table && placementOf(table, picks);
  return action ? applyAction(world, action) : world;
}

function applyRemoval(world: Network, incident: Incident, { tableId, entryId }: RemoveEntryMove): Network {
  const table = tableOf(incident, tableId);
  const action = table && removalOf(world, table, entryId);
  return action ? applyAction(world, action) : world;
}

/** Applies a player move; returns the same world when the move changes nothing (sending a packet, answering a card, waiting, an unknown firewall or chip, a rule that already exists in the list of its direction, a rule id that is not there, a setting the incident does not offer or whose chip is already in effect, an entry the table already has or the engine does not take, a table the incident does not offer, a row that is not there). A rule goes in the inbound list unless the move says outbound, and the same rule in the other list is not a duplicate. A setting move sets what its kind says: the default gateway of the device, its DNS server (the value of the chip, or none when the chip has none) or the listen address of the service it names. An entry move places a route or a record with the chips picked in the trays of a table, or removes the row of the table that has an id; a record gets the time to live of the game. */
export function applyMove(world: Network, incident: Incident, move: PlayerMove): Network {
  switch (move.type) {
    case 'sendPacket':
    case 'answerCard':
    case 'wait':
      return world;
    case 'setSetting':
      return applySetting(world, incident, move);
    case 'placeEntry':
      return applyPlacement(world, incident, move);
    case 'removeEntry':
      return applyRemoval(world, incident, move);
    case 'placeRule':
    case 'removeRule':
      return applyRule(world, incident, move);
  }
}

/** Says why the engine does not take a placement the incident offers: the code of the problem (`recordProblem` or `routeProblem`), or undefined when the engine takes it and also when the incident does not offer it (an unknown table, a tray without a pick, a pick that is no chip of its tray, chips that do not make a record), because then there is nothing to explain. */
export function placementProblem(world: Network, incident: Incident, { tableId, picks }: PlaceEntryMove): EntryProblem | undefined {
  const table = tableOf(incident, tableId);
  const action = table && placementOf(table, picks);
  if (!action) return undefined;
  return action.type === 'addRoute' ? routeProblem(world, action.routerId, action.route) : recordProblem(world, action.serverId, action.record);
}

/** Returns the world the changes of an incident are made on: its base world, or the reference solution of the previous incident of its chapter, or, for the first incident of its chapter that has changes, the reference solution of the last incident of the chapters before it. Incidents come in game order. */
export function worldBeforeChanges(incidents: Incident[], incidentId: string): Network {
  const incident = findIncident(incidents, incidentId);
  if (incident.base) return incident.base;
  const inChapter = incidents.filter((i) => i.chapter === incident.chapter && i.order < incident.order);
  const previous = inChapter.at(-1) ?? incidents.filter((i) => i.chapter < incident.chapter).at(-1);
  if (!previous) throw new Error(`${incidentId} has changes but no previous incident`);
  return solvedWorld(incidents, previous.id);
}

/** Returns the world an incident starts from: its base world, or the reference solution of the incident before it (the previous one of its chapter or, for the first of its chapter, the last of the chapters before) plus its changes. Incidents come in game order. */
export function startWorld(incidents: Incident[], incidentId: string): Network {
  return (findIncident(incidents, incidentId).changes ?? []).reduce(applyAction, worldBeforeChanges(incidents, incidentId));
}

/** Returns the world a case of a diagnose incident starts from: the world the incident starts from (`start`) plus the changes of the case itself, never the world of the case before. */
export function caseWorld(start: Network, { changes = [] }: Pick<CaseSpec, 'changes'>): Network {
  return changes.reduce(applyAction, start);
}

/** Returns the world after the incident's reference solution. A diagnose incident changes nothing in the world: the player only names causes, so it ends as it started. */
export function solvedWorld(incidents: Incident[], incidentId: string): Network {
  const incident = findIncident(incidents, incidentId);
  const start = startWorld(incidents, incidentId);
  return incident.mechanic === 'diagnose' ? start : incident.solution.reduce((world, move) => applyMove(world, incident, move), start);
}
