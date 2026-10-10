import { applyAction, type Network } from '@/engine';
import { ruleFromChips, sameRule } from './contract/chips';
import type { Incident, PlayerMove, SettingMove } from './contract/incident';

function findIncident(incidents: Incident[], incidentId: string): Incident {
  const found = incidents.find((i) => i.id === incidentId);
  if (!found) throw new Error(`unknown incident ${incidentId}`);
  return found;
}

function applySetting(world: Network, incident: Incident, { deviceId, settingId, chipId }: SettingMove): Network {
  const setting = incident.mechanic === 'send' ? incident.send.settings?.find((candidate) => candidate.deviceId === deviceId && candidate.id === settingId) : undefined;
  const chip = setting?.chips.find((candidate) => candidate.id === chipId);
  const device = world.devices.find((candidate) => candidate.id === deviceId);
  if (!chip || !device || (device.gateway ?? null) === chip.value) return world;
  return applyAction(world, { type: 'setGateway', deviceId, gateway: chip.value ?? undefined });
}

/** Applies a player move; returns the same world when the move changes nothing (sending a packet, answering a card, an unknown firewall or chip, a rule that already exists, a rule id that is not there, a setting the incident does not offer or whose chip is already in effect). A setting move sets the default gateway of the device to the value of the chip, or takes it away when the chip has none. */
export function applyMove(world: Network, incident: Incident, move: PlayerMove): Network {
  if (move.type === 'sendPacket' || move.type === 'answerCard') return world;
  if (move.type === 'setSetting') return applySetting(world, incident, move);
  const firewall = world.firewalls.find((f) => f.id === move.firewallId);
  if (!firewall) return world;
  if (move.type === 'removeRule') {
    return firewall.inbound.some((r) => r.id === move.ruleId) ? applyAction(world, move) : world;
  }
  const rule = ruleFromChips(incident, move.whatId, move.fromId);
  if (!rule || firewall.inbound.some((r) => sameRule(r, rule))) return world;
  return applyAction(world, { type: 'addRule', firewallId: move.firewallId, rule });
}

/** Returns the world an incident starts from: its base world, or the reference solution of the previous incident of its chapter plus its changes. Incidents come in game order. */
export function startWorld(incidents: Incident[], incidentId: string): Network {
  const incident = findIncident(incidents, incidentId);
  if (incident.base) return incident.base;
  const previous = incidents.filter((i) => i.chapter === incident.chapter && i.order < incident.order).at(-1);
  if (!previous) throw new Error(`${incidentId} has changes but no previous incident`);
  return (incident.changes ?? []).reduce(applyAction, solvedWorld(incidents, previous.id));
}

/** Returns the world after the incident's reference solution. */
export function solvedWorld(incidents: Incident[], incidentId: string): Network {
  const incident = findIncident(incidents, incidentId);
  return incident.solution.reduce((world, move) => applyMove(world, incident, move), startWorld(incidents, incidentId));
}
