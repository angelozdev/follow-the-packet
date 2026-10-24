import { z } from 'zod';
import { normalizeName } from '@/engine/dns/records';
import { isWebUrl } from './url';

const httpMethodSchema = z.enum(['GET', 'POST', 'PUT']);

const EXAMPLE_SUFFIX = '.example';

/** A name a site answers to: under `.example`, the top-level name that RFC 2606 reserves for documentation, so no name of the game is a real one. */
const siteNameSchema = z.string().refine((name) => normalizeName(name).endsWith(EXAMPLE_SUFFIX), 'a site name goes under .example');

/** The request a client makes inside a TCP connection: the method, the absolute url it asks for, the headers it adds and a body. The Host header and the length of the body are not given: the request builds them. */
export const httpMessageSchema = z.object({
  method: httpMethodSchema,
  url: z.string().refine(isWebUrl, 'an absolute http or https url'),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
});

const orderSchema = z.object({ id: z.number().int().nonnegative(), content: z.string() });

/** The orders of a site and how one reads: `template` holds the slots `{id}` and `{content}`, and `start` the orders the app begins with. */
const orderBookSchema = z.object({ template: z.string(), start: z.array(orderSchema) });

const handlerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fixed'), body: z.string() }),
  z.object({ kind: z.literal('order-read') }),
  z.object({ kind: z.literal('order-create') }),
  z.object({ kind: z.literal('order-replace') }),
]);

const pageSchema = z.object({ path: z.string().startsWith('/'), methods: z.array(httpMethodSchema).min(1), handler: handlerSchema });

/** A site: the names it answers to, its pages, the body of its 404 and, for a site that serves orders, its order book. */
export const siteSchema = z.object({
  id: z.string().min(1),
  names: z.array(siteNameSchema),
  pages: z.array(pageSchema),
  notFoundBody: z.string(),
  orders: orderBookSchema.optional(),
});

/** What a TCP service answers when someone speaks HTTP to it: its sites and the one that answers a request whose Host names none of them. */
export const webServiceSchema = z
  .object({ sites: z.array(siteSchema).min(1), defaultSiteId: z.string().min(1) })
  .superRefine((web, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = web.sites.map((site) => site.id);
    if (!ids.includes(web.defaultSiteId)) fail(`the default site ${web.defaultSiteId} is not a site of the service`);
    if (new Set(ids).size !== ids.length) fail('two sites share an id');
    for (const site of web.sites) {
      if (!site.orders && site.pages.some(({ handler }) => handler.kind.startsWith('order-'))) fail(`${site.id}: a page serves orders and the site has no order book`);
    }
  });

export type HttpMethod = z.infer<typeof httpMethodSchema>;
export type HttpMessage = z.infer<typeof httpMessageSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Site = z.infer<typeof siteSchema>;
export type WebService = z.infer<typeof webServiceSchema>;
