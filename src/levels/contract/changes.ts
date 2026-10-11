import compare from 'just-compare';
import { toPlainText, type TermText } from '@/copy';
import type { Network } from '@/engine';

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function changed<Piece extends { id: string }>(before: Piece[], after: Piece[]): Piece[] {
  return after.filter((piece) => {
    const earlier = before.find((candidate) => candidate.id === piece.id);
    return earlier !== undefined && !compare(earlier, piece);
  });
}

/** Returns, once each and in alphabetical order, the names of the devices and routers whose configuration differs between two worlds: a device whose settings differ (gateway, cable, application, answer to a ping) or whose firewall has other rules or another list of firewalls, and a router whose interfaces, routes or warnings differ. A piece that only exists in `after` (a device, a router, an actor or a LAN the action adds) is not a change to a configuration: the map shows it from then on, so no name is asked for it. Names are read from the worlds, which build them from the same registry the texts of the incident use. */
export function changedNames(before: Network, after: Network): string[] {
  const guarded = changed(before.firewalls, after.firewalls).flatMap(({ id }) => after.devices.filter((device) => device.firewallIds.includes(id)));
  const names = [...changed(before.devices, after.devices), ...guarded, ...changed(before.routers ?? [], after.routers ?? [])].map(({ name }) => name);
  return names.filter((name, index) => names.indexOf(name) === index).sort((a, b) => a.localeCompare(b));
}

/** Says whether a text names a piece as the player reads it: the name as a whole word, with the tags of terms and names taken off. */
export function mentions(text: TermText, name: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}-])${escapeForPattern(name)}(?![\\p{L}\\p{N}-])`, 'u').test(toPlainText(text));
}

/** Returns the devices and routers whose configuration differs between two worlds and that none of the texts names. */
export function unnamedChanges(before: Network, after: Network, texts: TermText[]): string[] {
  return changedNames(before, after).filter((name) => !texts.some((text) => mentions(text, name)));
}
