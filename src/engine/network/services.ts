import { LOOPBACK_IP } from '@/engine/network/addressing/cidr';
import type { Process, Service } from './types';

/** What a device or a server does with a packet for a protocol and a port: `accepts` when a service takes it, `wrong-address` when a service listens on that port but not on the IP the packet is for, `stopped` when the only services on that port belong to processes that are not running, and `closed` when no service is on that port. */
export type ServiceLookup = 'accepts' | 'wrong-address' | 'stopped' | 'closed';

/** True when the service takes a packet addressed to `destinationIp`. A service on `all` addresses takes it whatever the IP, because the packet reached the device by one of its own; a service on the loopback address listens on `127.0.0.1` only, so it takes only a packet to that exact address, not to another `127.x.x.x` one. Reasoned from ip(7), not tested on a real machine (`src/engine/network/CLAUDE.md`). */
export function listensOn(service: Pick<Service, 'listen'>, destinationIp: string): boolean {
  return service.listen === 'all' || destinationIp === LOOPBACK_IP;
}

/** True when the program behind the service runs: a service with no `processId` always does, and one with a `processId` does while that process of `processes` runs. */
function runs({ processId }: Pick<Service, 'processId'>, processes: readonly Process[]): boolean {
  return processId === undefined || processes.some(({ id, running }) => id === processId && running);
}

/** Returns the service of `protocol` and `port` that takes a packet addressed to `destinationIp`, or undefined when none does. A service whose process is not running among `processes` does not listen. */
export function acceptingService(services: readonly Service[], protocol: Service['protocol'], port: number, destinationIp: string, processes: readonly Process[] = []): Service | undefined {
  return services.find((service) => service.protocol === protocol && service.port === port && runs(service, processes) && listensOn(service, destinationIp));
}

/** Looks for the service that takes a packet of `protocol` for `port` and `destinationIp`, among the `services` of a device or a server, whose `processes` say which programs run. */
export function lookupService(services: readonly Service[], protocol: Service['protocol'], port: number, destinationIp: string, processes: readonly Process[] = []): ServiceLookup {
  const onPort = services.filter((service) => service.protocol === protocol && service.port === port);
  const running = onPort.filter((service) => runs(service, processes));
  if (running.some((service) => listensOn(service, destinationIp))) return 'accepts';
  if (running.length > 0) return 'wrong-address';
  return onPort.length > 0 ? 'stopped' : 'closed';
}
