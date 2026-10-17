import { FIRST_WARNING_TERM, type TermId } from '@/copy';
import type { Network, Router, TracerouteLine } from '@/engine';
import type { Session } from '@/game/session';

/** Returns the IP that answered when the player can see the answer: the destination always, and a warning once its term is known (a router with no route, which has no term of its own, once the first warning term is known); an unknown warning is seen as a hop nobody answered. */
export function visibleIp(line: TracerouteLine, known: ReadonlySet<TermId>): string | undefined {
  if (line.reached) return line.ip;
  const warning: TermId = line.unreachable ? FIRST_WARNING_TERM : 'time-exceeded';
  return known.has(warning) ? line.ip : undefined;
}

/** Returns the router of the world that has this IP on one of its interfaces, or undefined when none does (the server, or a device). */
export function routerWithIp(world: Network, ip: string): Router | undefined {
  return (world.routers ?? []).find((candidate) => candidate.interfaces.some((face) => face.ip === ip));
}

/** Returns the ids of the routers the player has been shown by a traceroute: those whose IP is on a line of a traceroute sent so far, as the terminal prints it. A line the player cannot read (a warning whose term is unknown) names nobody, and a router that no probe crosses is never in it. */
export function revealedRouterIds({ world, known, sent }: Pick<Session, 'world' | 'known' | 'sent'>): ReadonlySet<string> {
  const ips = sent.flatMap((run) => (run.route?.lines ?? []).flatMap((line) => visibleIp(line, known) ?? []));
  return new Set(ips.flatMap((ip) => routerWithIp(world, ip)?.id ?? []));
}
