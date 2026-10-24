import { LOOPBACK_IP } from '@/engine/network/addressing/cidr';
import type { Service } from './types';

/** What a device or a server does with a packet for a protocol and a port: `accepts` when a service takes it, `wrong-address` when a service listens on that port but not on the IP the packet is for, and `closed` when nobody listens on that port. */
export type ServiceLookup = 'accepts' | 'wrong-address' | 'closed';

/** True when the service takes a packet addressed to `destinationIp`. A service on `all` addresses takes it whatever the IP, because the packet reached the device by one of its own; a service on the loopback address listens on `127.0.0.1` only, so it takes only a packet to that exact address, not to another `127.x.x.x` one. Reasoned from ip(7), not tested on a real machine (`src/engine/network/CLAUDE.md`). */
export function listensOn(service: Pick<Service, 'listen'>, destinationIp: string): boolean {
  return service.listen === 'all' || destinationIp === LOOPBACK_IP;
}

/** Returns the service of `protocol` and `port` that takes a packet addressed to `destinationIp`, or undefined when none does. */
export function acceptingService(services: readonly Service[], protocol: Service['protocol'], port: number, destinationIp: string): Service | undefined {
  return services.find((service) => service.protocol === protocol && service.port === port && listensOn(service, destinationIp));
}

/** Looks for the service that takes a packet of `protocol` for `port` and `destinationIp`, among the `services` of a device or a server. */
export function lookupService(services: readonly Service[], protocol: Service['protocol'], port: number, destinationIp: string): ServiceLookup {
  const onPort = services.filter((service) => service.protocol === protocol && service.port === port);
  if (onPort.some((service) => listensOn(service, destinationIp))) return 'accepts';
  return onPort.length > 0 ? 'wrong-address' : 'closed';
}
