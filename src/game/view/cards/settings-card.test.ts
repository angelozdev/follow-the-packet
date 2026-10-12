import { describe, expect, it } from 'vitest';
import { toPlainText } from '@/copy';
import { applyAction } from '@/engine';
import { OFFICE_FLOORS, filterIncident, gatewayIncident, identifyIncident, namesSendIncident, officeWithNames, sendIncident, tcpService } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { servicesCard, settingsCard } from './settings-card';

const GATEWAY = gatewayIncident();
const START = startSession([GATEWAY], GATEWAY.id);
const YOU = PIECE_ID.device('your-laptop');
const CHIPS = [
  { id: 'none', label: 'Ninguna' },
  { id: 'router', label: '192.168.1.1' },
  { id: 'printer', label: '192.168.1.21' },
  { id: 'nobody', label: '192.168.1.99' },
];

function pickedBy(session: Session): string | null | undefined {
  return settingsCard(session, YOU)?.settings[0].picked;
}

describe('settings card', () => {
  it('lists the settings the incident offers for the device, each with its chips and the one that matches the world', () => {
    expect(settingsCard(START, YOU)).toEqual({
      deviceId: 'your-laptop',
      pieceId: YOU,
      title: 'Ajustes de red de [[tu-laptop]]',
      settings: [{ id: 'gateway', name: 'puerta de enlace predeterminada', picked: 'none', chips: CHIPS }],
      dns: null,
    });
    const set = (chipId: string): Session => sessionReducer(START, { type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId });
    expect(pickedBy(set('router'))).toBe('router');
    expect(pickedBy(set('printer'))).toBe('printer');
    expect(pickedBy(sessionReducer(set('router'), { type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId: 'none' }))).toBe('none');
  });

  it('picks no chip when the gateway of the world is one that no chip stands for', () => {
    const world = applyAction(START.world, { type: 'setGateway', deviceId: 'your-laptop', gateway: '192.168.1.200' });
    expect(pickedBy({ ...START, world })).toBeNull();
  });

  it('a device with no settings has no settings card', () => {
    expect(settingsCard(START, PIECE_ID.device('printer'))).toBeNull();
    expect(settingsCard(START, PIECE_ID.device('ghost'))).toBeNull();
    expect(settingsCard(START, PIECE_ID.actor('your-laptop'))).toBeNull();
    const sending = sendIncident();
    expect(settingsCard(startSession([sending], sending.id), PIECE_ID.device('your-laptop'))).toBeNull();
    const identifying = identifyIncident();
    expect(settingsCard(startSession([identifying], identifying.id), PIECE_ID.device('printer'))).toBeNull();
    expect(settingsCard(startSession([filterIncident('04-01')], '04-01'), PIECE_ID.device('servidor1'))).toBeNull();
  });
});

describe('settings card of the other kinds of setting', () => {
  const NAMES = namesSendIncident();
  const SERVING = { ...NAMES, base: applyAction(officeWithNames(), { type: 'setServices', ownerId: 'lucia-laptop', services: [tcpService(3000)] }) };
  const START_NAMES = startSession([SERVING], SERVING.id);
  const LUCIA = PIECE_ID.device('lucia-laptop');
  const set = (session: Session, deviceId: string, settingId: string, chipId: string): Session => sessionReducer(session, { type: 'setSetting', deviceId, settingId, chipId });
  const pickedIn = (session: Session, deviceId: string): (string | null)[] => (settingsCard(session, PIECE_ID.device(deviceId))?.settings ?? []).map(({ picked }) => picked);
  const servicePicked = (session: Session): (string | null)[] => (servicesCard(session, LUCIA)?.services ?? []).map(({ picked }) => picked);
  const without = (session: Session, ...terms: string[]): Session => ({ ...session, known: new Set([...session.known].filter((term) => !terms.includes(term))) });

  it('the chip picked for a DNS server is the one that matches the resolver of the device, not its gateway', () => {
    expect(START_NAMES.world.devices.find((device) => device.id === 'your-laptop')?.gateway).toBe(OFFICE_FLOORS.floor1.gateway);
    expect(pickedIn(START_NAMES, 'your-laptop')).toEqual(['resolver']);
    expect(pickedIn(set(START_NAMES, 'your-laptop', 'resolver', 'none'), 'your-laptop')).toEqual(['none']);
    const elsewhere = applyAction(START_NAMES.world, { type: 'setDnsServer', deviceId: 'your-laptop', server: '198.51.100.200' });
    expect(pickedIn({ ...START_NAMES, world: elsewhere }, 'your-laptop')).toEqual([null]);
  });

  it('the chip picked for a listen address is the one that matches the service it names, and none when the device has no such service', () => {
    expect(servicePicked(START_NAMES)).toEqual(['all']);
    expect(servicePicked(set(START_NAMES, 'lucia-laptop', 'app', 'loopback'))).toEqual(['loopback']);
    const noService = startSession([NAMES], NAMES.id);
    expect(servicePicked(noService)).toEqual([null]);
  });

  it('the services card has a tray for the listen address of each service', () => {
    const second = { ...NAMES.send.settings![1], id: 'ssh', service: { protocol: 'tcp', port: 22 } } as const;
    const twice = { ...SERVING, send: { ...SERVING.send, settings: [...SERVING.send.settings!, second] } };
    const world = applyAction(SERVING.base!, { type: 'setServices', ownerId: 'lucia-laptop', services: [tcpService(3000), tcpService(22, 'loopback')] });
    const card = servicesCard(startSession([{ ...twice, base: world }], twice.id), LUCIA);
    expect(card?.title).toBe('Servicios de [[laptop-lucia]]');
    expect(card?.services.map(({ id, service, picked, name }) => ({ id, service: toPlainText(service), picked, name }))).toEqual([
      { id: 'app', service: 'TCP 3000', picked: 'all', name: 'dirección de escucha' },
      { id: 'ssh', service: 'TCP 22', picked: 'loopback', name: 'dirección de escucha' },
    ]);
    expect(card?.services[0].chips.map(({ id }) => id)).toEqual(['all', 'loopback']);
  });

  it('the services card calls the port by its number until the protocol is known, and has no card for a device with no listen address to set', () => {
    expect(toPlainText(servicesCard(without(START_NAMES, 'tcp'), LUCIA)?.services[0].service ?? '')).toBe('puerto 3000');
    expect(servicesCard(START_NAMES, PIECE_ID.device('your-laptop'))).toBeNull();
    expect(servicesCard(START_NAMES, PIECE_ID.device('ghost'))).toBeNull();
    expect(servicesCard(START, YOU)).toBeNull();
  });

  it('the network settings card shows the dns server behind the term dhcp once it is known', () => {
    expect(pickedIn(START_NAMES, 'your-laptop')).toEqual(['resolver']);
    const before = without(START_NAMES, 'dhcp');
    expect(settingsCard(before, PIECE_ID.device('your-laptop'))).toBeNull();
    const readOnly = startSession([{ ...SERVING, send: { ...SERVING.send, settings: SERVING.send.settings!.filter((setting) => setting.kind === 'listen-address') } }], SERVING.id);
    expect(settingsCard(without(readOnly, 'dhcp'), PIECE_ID.device('your-laptop'))).toBeNull();
    const card = settingsCard(readOnly, PIECE_ID.device('your-laptop'));
    expect(card?.settings).toEqual([]);
    expect(card?.dns && { label: toPlainText(card.dns.label), value: toPlainText(card.dns.value), note: toPlainText(card.dns.note) }).toEqual({ label: 'Servidor DNS', value: '198.51.100.8 servidor-dns', note: 'Lo prestó DHCP.' });
  });

  it('a device with no dns server and no gateway to set has no network settings card, and a tray that sets the dns server replaces the line', () => {
    const readOnly = startSession([{ ...SERVING, send: { ...SERVING.send, settings: [] } }], SERVING.id);
    expect(settingsCard(readOnly, PIECE_ID.device('lucia-laptop'))).toBeNull();
    expect(settingsCard(START_NAMES, PIECE_ID.device('your-laptop'))?.dns).toBeNull();
  });
});
