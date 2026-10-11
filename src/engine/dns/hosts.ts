import { sameName } from './records';
import type { Device, HostLine } from '@/engine/network/types';
import type { DnsTrace } from '@/engine/simulation/trace';

/** Returns the first line of the hosts file of a device that is for the name, or undefined. Names are compared the way DNS names are, with no case and no trailing dot (`sameName`); that the hosts lookup of a real system does the same was not verified. */
export function hostsLine(device: Pick<Device, 'hosts'>, name: string): HostLine | undefined {
  return (device.hosts ?? []).find((line) => sameName(line.name, name));
}

/** The `Trace.dns` of a name that the hosts file answered. Nothing was asked, so there is no DNS answer: `answers` is empty and the IP is the `resolvedIp` of the trace and the one of the step. The status is `NOERROR` because the name has an address; `usedHostsFile` is what tells it from a name that exists and holds none. */
export function hostsTrace(name: string): DnsTrace {
  return { name, status: 'NOERROR', answers: [], fromCache: false, usedHostsFile: true, viaDig: false };
}
