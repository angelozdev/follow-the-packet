import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine';
import { filterIncident, gatewayIncident, identifyIncident, sendIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { settingsCard, settingsDeviceIds } from './settings-card';

const GATEWAY = gatewayIncident();
const START = startSession([GATEWAY], GATEWAY.id);
const ENTRY = PIECE_ID.settings('your-laptop');
const CHIPS = [
  { id: 'none', label: 'Ninguna' },
  { id: 'router', label: '192.168.1.1' },
  { id: 'printer', label: '192.168.1.21' },
  { id: 'nobody', label: '192.168.1.99' },
];

function pickedBy(session: Session): string | null | undefined {
  return settingsCard(session, ENTRY)?.settings[0].picked;
}

describe('settings card', () => {
  it('lists the settings the incident offers for the device, each with its chips and the one that matches the world', () => {
    expect(settingsCard(START, ENTRY)).toEqual({
      deviceId: 'your-laptop',
      pieceId: PIECE_ID.device('your-laptop'),
      title: 'Ajustes de red de [[tu-laptop]]',
      settings: [{ id: 'gateway', name: 'puerta de enlace predeterminada', picked: 'none', chips: CHIPS }],
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
    expect(settingsCard(START, PIECE_ID.settings('printer'))).toBeNull();
    expect(settingsCard(START, PIECE_ID.device('your-laptop'))).toBeNull();
    expect(settingsCard(START, PIECE_ID.settings('ghost'))).toBeNull();
    const sending = sendIncident();
    expect(settingsCard(startSession([sending], sending.id), PIECE_ID.settings('your-laptop'))).toBeNull();
    const identifying = identifyIncident();
    expect(settingsCard(startSession([identifying], identifying.id), PIECE_ID.settings('printer'))).toBeNull();
    expect(settingsCard(startSession([filterIncident('04-01')], '04-01'), PIECE_ID.settings('servidor1'))).toBeNull();
  });

  it('lists the devices that have settings once each, in the order of the incident, and none for an incident without them', () => {
    expect(settingsDeviceIds(START)).toEqual(['your-laptop']);
    const [gateway] = GATEWAY.send.settings ?? [];
    const twice = { ...GATEWAY, send: { ...GATEWAY.send, settings: [gateway, { ...gateway, id: 'second' }] } };
    expect(settingsDeviceIds(startSession([twice], twice.id))).toEqual(['your-laptop']);
    const sending = sendIncident();
    expect(settingsDeviceIds(startSession([sending], sending.id))).toEqual([]);
  });
});
