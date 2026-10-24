import type { RestartKind } from '@/copy';
import { DEFAULT_DIRECTION, applyAction, listenSchema, recordProblem, routeProblem, siteProblem, type Device, type Network, type RecordProblem, type RouteProblem, type SiteProblem } from '@/engine';
import { ruleFromChips, sameRule } from './contract/chips';
import { settingKind, type CaseSpec, type Incident, type PlaceEntryMove, type PlayerMove, type RemoveEntryMove, type RuleMove, type SettingMove, type SettingSpec, type TableMove } from './contract/incident';
import { chipProblem, placementOf, removalOf, tableOf, type ChipProblem } from './contract/tables';

function findIncident(incidents: Incident[], incidentId: string): Incident {
  const found = incidents.find((i) => i.id === incidentId);
  if (!found) throw new Error(`unknown incident ${incidentId}`);
  return found;
}

/** Why an entry the player placed does not go in: the engine does not take it (a record code, a route code or a site code) or the chips do not make an entry (an address record with no IP). */
export type EntryProblem = RecordProblem | RouteProblem | SiteProblem | ChipProblem;

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

function settingOf(incident: Incident, { deviceId, settingId }: Pick<SettingMove, 'deviceId' | 'settingId'>): SettingSpec | undefined {
  return incident.mechanic === 'send' ? incident.send.settings?.find((candidate) => candidate.deviceId === deviceId && candidate.id === settingId) : undefined;
}

function applySetting(world: Network, incident: Incident, move: SettingMove): Network {
  const { deviceId, chipId } = move;
  const setting = settingOf(incident, move);
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

function applyPlacement(world: Network, incident: Incident, { tableId, picks }: PlaceEntryMove, spec?: CaseSpec | null): Network {
  const table = tableOf(incident, tableId, spec);
  const action = table && placementOf(table, picks);
  return action ? applyAction(world, action) : world;
}

function applyRemoval(world: Network, incident: Incident, { tableId, entryId }: RemoveEntryMove, spec?: CaseSpec | null): Network {
  const table = tableOf(incident, tableId, spec);
  const action = table && removalOf(world, table, entryId);
  return action ? applyAction(world, action) : world;
}

/** Applies a player move; returns the same world when the move changes nothing (sending a packet, answering a card, waiting, an unknown firewall or chip, a rule that already exists in the list of its direction, a rule id that is not there, a setting the incident does not offer or whose chip is already in effect, an entry the table already has or the engine does not take, a table the incident does not offer, a row that is not there). A rule goes in the inbound list unless the move says outbound, and the same rule in the other list is not a duplicate. A setting move sets what its kind says: the default gateway of the device, its DNS server (the value of the chip, or none when the chip has none) or the listen address of the service it names. An entry move places a route or a record with the chips picked in the trays of a table, or removes the row of the table that has an id; a record gets the time to live of the game. The tables an entry move reads are those of the send incident or, given the case of a diagnose the player is on (`spec`), only those of the fix of that case: a diagnose changes the world with nothing else. */
export function applyMove(world: Network, incident: Incident, move: PlayerMove, spec?: CaseSpec | null): Network {
  switch (move.type) {
    case 'sendPacket':
    case 'answerCard':
    case 'wait':
      return world;
    case 'setSetting':
      return applySetting(world, incident, move);
    case 'placeEntry':
      return applyPlacement(world, incident, move, spec);
    case 'removeEntry':
      return applyRemoval(world, incident, move, spec);
    case 'placeRule':
    case 'removeRule':
      return applyRule(world, incident, move);
  }
}

/** Returns the part of the world a move edits and who owns it: the kind of the setting or of the table it changes, or a rule, and the id of the device, router or server that holds it (for a rule, the device with that firewall). Undefined when the incident does not offer what the move names. The tables are those of the incident or, given the case of a diagnose the player is on (`spec`), those of the fix of that case. */
export function editedPart(world: Network, incident: Incident, move: SettingMove | TableMove | RuleMove, spec?: CaseSpec | null): { kind: RestartKind; ownerId: string } | undefined {
  switch (move.type) {
    case 'setSetting': {
      const setting = settingOf(incident, move);
      return setting && { kind: settingKind(setting), ownerId: move.deviceId };
    }
    case 'placeEntry':
    case 'removeEntry': {
      const table = tableOf(incident, move.tableId, spec);
      return table && { kind: table.kind, ownerId: table.ownerId };
    }
    case 'placeRule':
    case 'removeRule': {
      const holder = world.devices.find((device) => device.firewallIds.includes(move.firewallId));
      return holder && { kind: 'rule', ownerId: holder.id };
    }
  }
}

/** Says why a placement the incident (or the fix of the case `spec`) offers does not go in: the code of the problem (`recordProblem`, `routeProblem` or `siteProblem` when the engine refuses it, or `chipProblem` when the chips make no record), or undefined when the engine takes it and also when the incident does not offer it (an unknown table, a tray without a pick, a pick that is no chip of its tray), because then there is nothing to explain. */
export function placementProblem(world: Network, incident: Incident, { tableId, picks }: PlaceEntryMove, spec?: CaseSpec | null): EntryProblem | undefined {
  const table = tableOf(incident, tableId, spec);
  if (!table) return undefined;
  const action = placementOf(table, picks);
  if (!action) return chipProblem(table, picks);
  switch (action.type) {
    case 'addRoute':
      return routeProblem(world, action.routerId, action.route);
    case 'addRecord':
      return recordProblem(world, action.serverId, action.record);
    case 'addSite':
      return siteProblem(world, action.ownerId, action.port, action.site);
  }
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
