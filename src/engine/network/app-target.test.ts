import { describe, expect, it } from 'vitest';
import { inst, lab03Net, ping, withInstance } from '@/testing';
import { APP_TARGET, materialize } from './app-target';

describe('materialize', () => {
  it('replaces the app target placeholder with the target of the source instance', () => {
    const net = withInstance(lab03Net(), 'servidor1', { appTarget: '172.31.38.97' });
    expect(materialize(ping(inst('servidor1'), APP_TARGET), net).to).toBe('172.31.38.97');
  });

  it('leaves other packets untouched', () => {
    const packet = ping(inst('servidor1'), '172.31.38.97');
    expect(materialize(packet, lab03Net())).toBe(packet);
  });

  it('fails when the source instance has no app target', () => {
    expect(() => materialize(ping(inst('servidor1'), APP_TARGET), lab03Net())).toThrow(APP_TARGET);
  });
});
