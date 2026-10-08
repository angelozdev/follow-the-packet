import type { Network } from './types';

export function publicDnsName(publicIp: string, region: string): string {
  return `ec2-${publicIp.replaceAll('.', '-')}.${region}.compute.amazonaws.com`;
}

export function privateDnsName(privateIp: string, region: string): string {
  return `ip-${privateIp.replaceAll('.', '-')}.${region}.compute.internal`;
}

/** Resolves an EC2 DNS name the way AWS does: from inside the VPC a public name gives the private IP and from outside the public IP; a private name resolves only inside. Returns null when nothing answers. */
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
