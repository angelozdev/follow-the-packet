import { describe, expect, it } from 'vitest';
import { privateDnsName, publicDnsName, resolveName } from './dns';
import { lab03Net } from './fixtures';

describe('nombres DNS de EC2', () => {
  it('siguen el formato que vimos en el lab 03', () => {
    expect(publicDnsName('34.244.254.100', 'eu-west-1')).toBe('ec2-34-244-254-100.eu-west-1.compute.amazonaws.com');
    expect(privateDnsName('172.31.38.97', 'eu-west-1')).toBe('ip-172-31-38-97.eu-west-1.compute.internal');
  });
});

describe('resolveName (lab 03, V3)', () => {
  const net = lab03Net();
  const publicName = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

  it('desde dentro de la VPC, el nombre público da la IP privada', () => {
    expect(resolveName(net, publicName, true)).toBe('172.31.38.97');
  });

  it('desde fuera, el mismo nombre da la IP pública', () => {
    expect(resolveName(net, publicName, false)).toBe('34.244.254.100');
  });

  it('el nombre privado no se resuelve desde fuera', () => {
    expect(resolveName(net, 'ip-172-31-38-97.eu-west-1.compute.internal', false)).toBeNull();
  });

  it('un nombre desconocido no se resuelve', () => {
    expect(resolveName(net, 'no-existe.example', true)).toBeNull();
  });
});
