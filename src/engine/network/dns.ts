import type { Network } from './types';

export function publicDnsName(publicIp: string, region: string): string {
  return `ec2-${publicIp.replaceAll('.', '-')}.${region}.compute.amazonaws.com`;
}

export function privateDnsName(privateIp: string, region: string): string {
  return `ip-${privateIp.replaceAll('.', '-')}.${region}.compute.internal`;
}

/**
 * Resuelve como el DNS de AWS: desde dentro de la VPC, el nombre público de una
 * instancia da su IP privada; desde fuera, la pública (lab 03, V3). El nombre
 * privado solo existe dentro de la VPC.
 */
export function resolveName(net: Network, name: string, fromInsideVpc: boolean): string | null {
  for (const instance of net.instances) {
    if (instance.publicIp && name === publicDnsName(instance.publicIp, net.region)) {
      return fromInsideVpc ? instance.privateIp : instance.publicIp;
    }
    if (name === privateDnsName(instance.privateIp, net.region)) {
      return fromInsideVpc ? instance.privateIp : null;
    }
  }
  return null;
}
