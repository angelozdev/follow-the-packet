import type { Role } from '@/copy';
import type { ServerActor, Site } from '@/engine';

const PRIORITY: readonly Role[] = ['proxy', 'app', 'web', 'resolver', 'authoritative'];

function keepsState({ pages }: Site): boolean {
  return pages.some(({ handler }) => handler.kind !== 'fixed');
}

/** Takes a server of the internet; returns the roles its configuration gives it, the one that redirects the packet first: a server of names is a `resolver` or an `authoritative` one as its dns says, a web service whose site keeps orders or logs users in is an `app`, and one whose sites serve fixed pages is a `web` server. A server with no dns and no web service has none. */
export function rolesOf(server: ServerActor): Role[] {
  const sites = (server.services ?? []).flatMap(({ web }) => web?.sites ?? []);
  const held: Partial<Record<Role, boolean>> = {
    resolver: server.dns?.role === 'resolver',
    authoritative: server.dns?.role === 'authoritative',
    proxy: sites.some(({ proxy }) => proxy !== undefined),
    web: sites.some((site) => !keepsState(site)),
    app: sites.some(keepsState),
  };
  return PRIORITY.filter((role) => held[role]);
}

/** Takes the roles of a server; returns the one its mark shows: the role that redirects the packet wins, the proxy over the app and the app over the web server. Undefined when it has none. */
export function markOf(roles: readonly Role[]): Role | undefined {
  return PRIORITY.find((role) => roles.includes(role));
}
