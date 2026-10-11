import compare from 'just-compare';
import { toPlainText, type TermText } from '@/copy';
import type { Device, Network } from '@/engine';

const MIN_DEVICES_FOR_A_FLOOR = 2;

interface Floor {
  name: string;
  devices: string[];
}

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function changed<Piece extends { id: string }>(before: Piece[], after: Piece[]): Piece[] {
  return after.filter((piece) => {
    const earlier = before.find((candidate) => candidate.id === piece.id);
    return earlier !== undefined && !compare(earlier, piece);
  });
}

function changedDevices(before: Network, after: Network): Device[] {
  const guarded = changed(before.firewalls, after.firewalls).flatMap(({ id }) => after.devices.filter((device) => device.firewallIds.includes(id)));
  return [...changed(before.devices, after.devices), ...guarded].filter((device, index, devices) => devices.indexOf(device) === index);
}

/** Returns, once each and in alphabetical order, the names of the devices and routers whose configuration differs between two worlds: a device whose settings differ (gateway, cable, application, answer to a ping) or whose firewall has other rules or another list of firewalls, and a router whose interfaces, routes or warnings differ. A piece that only exists in `after` (a device, a router, an actor or a LAN the action adds) is not a change to a configuration: the map shows it from then on, so no name is asked for it. Names are read from the worlds, which build them from the same registry the texts of the incident use. */
export function changedNames(before: Network, after: Network): string[] {
  const names = [...changedDevices(before, after), ...changed(before.routers ?? [], after.routers ?? [])].map(({ name }) => name);
  return names.filter((name, index) => names.indexOf(name) === index).sort((a, b) => a.localeCompare(b));
}

/** Returns the floors, the LANs of the world after the changes, on which every device changed (a floor with a single device is named by that device): each with its name and the names of its devices. A text may name such a floor instead of each of its devices, because it tells the same change to all of them. */
export function changedFloors(before: Network, after: Network): Floor[] {
  const moved = changedDevices(before, after);
  return (after.lans ?? []).flatMap(({ id, name }) => {
    const onFloor = after.devices.filter((device) => device.lanId === id);
    return onFloor.length >= MIN_DEVICES_FOR_A_FLOOR && onFloor.every((device) => moved.includes(device)) ? [{ name, devices: onFloor.map((device) => device.name) }] : [];
  });
}

/** Says whether a text names a piece as the player reads it: the name as a whole word, with the tags of terms and names taken off. */
export function mentions(text: TermText, name: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}-])${escapeForPattern(name)}(?![\\p{L}\\p{N}-])`, 'u').test(toPlainText(text));
}

/** Returns the devices and routers whose configuration differs between two worlds and that none of the texts names. A device is named too when a text names the floor on which every device changed (`changedFloors`). */
export function unnamedChanges(before: Network, after: Network, texts: TermText[]): string[] {
  const named = (name: string) => texts.some((text) => mentions(text, name));
  const onNamedFloors = changedFloors(before, after).filter(({ name }) => named(name)).flatMap(({ devices }) => devices);
  return changedNames(before, after).filter((name) => !named(name) && !onNamedFloors.includes(name));
}
