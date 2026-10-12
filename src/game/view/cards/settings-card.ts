import { SERVICES_TEXT, SETTINGS_TEXT, deviceName, nameTag, toPlainText, type TermText } from '@/copy';
import type { Device, ServerActor } from '@/engine';
import { settingKind, settingValue, shownOf, type SendIncident, type SettingSpec } from '@/levels';
import { currentCase, type Session } from '@/game/session';
import { PIECE_ID, parsePieceId } from '@/game/view/piece-id';

interface SettingChip {
  id: string;
  label: TermText;
}

interface SettingTray {
  id: string;
  name: string;
  picked: string | null;
  chips: SettingChip[];
}

/** The DNS server a device has, shown when the incident offers nothing to set it with: its address, the server behind it when the map draws one, and where the device got it from. */
interface DnsLine {
  label: TermText;
  value: TermText;
  note: TermText;
}

export interface SettingsCard {
  deviceId: string;
  pieceId: string;
  title: TermText;
  settings: SettingTray[];
  dns: DnsLine | null;
}

interface ServiceTray extends SettingTray {
  service: TermText;
}

export interface ServicesCard {
  deviceId: string;
  pieceId: string;
  title: TermText;
  services: ServiceTray[];
}

function offeredSettings(session: Session): SettingSpec[] {
  const incident: SendIncident | null = session.incident.mechanic === 'send' ? session.incident : null;
  return incident?.send.settings ?? [];
}

function deviceOf(session: Session, pieceId: string): Device | undefined {
  const ref = parsePieceId(pieceId);
  return ref?.kind === 'device' ? session.world.devices.find((candidate) => candidate.id === ref.id) : undefined;
}

/** True when the player knows where the DNS server of a device comes from: the term that says a server lends it (`dhcp`). Before that the card shows no DNS server. */
function showsDns(session: Session): boolean {
  return session.known.has('dhcp');
}

function networkSettings(session: Session, deviceId: string): SettingSpec[] {
  return offeredSettings(session).filter((setting) => setting.deviceId === deviceId && settingKind(setting) !== 'listen-address' && (settingKind(setting) !== 'dns-server' || showsDns(session)));
}

function serviceSettings(session: Session, deviceId: string): SettingSpec[] {
  return offeredSettings(session).filter((setting) => setting.deviceId === deviceId && settingKind(setting) === 'listen-address');
}

function trayOf(session: Session, setting: SettingSpec): SettingTray {
  return {
    id: setting.id,
    name: toPlainText(setting.name),
    picked: setting.chips.find((chip) => chip.value === settingValue(session.world, setting))?.id ?? null,
    chips: setting.chips.map(({ id, label }) => ({ id, label })),
  };
}

function nameOfIp(session: Session, ip: string): TermText | null {
  const { world } = session;
  const listed = shownOf(session.incident, currentCase(session));
  const owner = world.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.ip === ip) ?? world.devices.find((candidate) => candidate.privateIp === ip);
  return owner && (listed === undefined || listed.includes(owner.id)) ? nameTag(owner.name) : null;
}

function dnsLineOf(session: Session, device: Device, offered: SettingSpec[]): DnsLine | null {
  const covered = offered.some((setting) => settingKind(setting) === 'dns-server');
  if (device.dnsServer === undefined || covered || !showsDns(session) || session.incident.mechanic !== 'send') return null;
  return { label: SETTINGS_TEXT.dns.label, value: SETTINGS_TEXT.dns.value(device.dnsServer, nameOfIp(session, device.dnsServer)), note: SETTINGS_TEXT.dns.lent };
}

/** Returns what the «Ajustes de red» card of a device shows: its title and, for each gateway or DNS server setting the incident offers for it, the name of the tray by its term, the chips, and the chip that matches the world, which is the one whose value is what the setting has now (`settingValue`), or none when no chip stands for it. The tray of a DNS server shows only once `dhcp` is known. A device that has a DNS server the incident gives no way to set shows it as a line, once `dhcp` is known, and says it was lent. `pieceId` is the piece of the device, which opens the card. Null when the piece is no device or when there is nothing to show. */
export function settingsCard(session: Session, pieceId: string): SettingsCard | null {
  const device = deviceOf(session, pieceId);
  if (!device) return null;
  const offered = networkSettings(session, device.id);
  const dns = dnsLineOf(session, device, offered);
  if (offered.length === 0 && dns === null) return null;
  return { deviceId: device.id, pieceId: PIECE_ID.device(device.id), title: SETTINGS_TEXT.title(deviceName(session.world, device.id)), settings: offered.map((setting) => trayOf(session, setting)), dns };
}

/** Returns what the «Servicios» card of a device shows: its title and a tray for the listen address of each service the incident offers a setting for, with the service it sets (its protocol, once known, and its port), the chips and the chip that matches the world. Null when the piece is no device or the incident offers it no listen address. */
export function servicesCard(session: Session, pieceId: string): ServicesCard | null {
  const device = deviceOf(session, pieceId);
  const offered = device ? serviceSettings(session, device.id) : [];
  if (!device || offered.length === 0) return null;
  return {
    deviceId: device.id,
    pieceId: PIECE_ID.device(device.id),
    title: SERVICES_TEXT.title(deviceName(session.world, device.id)),
    services: offered.flatMap((setting) => (setting.service ? [{ ...trayOf(session, setting), service: SERVICES_TEXT.service(setting.service, session.known) }] : [])),
  };
}
