import { describe, expect, it } from 'vitest';
import { answerRequest, chooseSite, type Orders } from './app';
import { requestOf } from './messages';
import type { HttpMethod, Site, WebService } from './schema';

const NOT_FOUND = 'Nothing at that path.';
const ORDERS: Site['orders'] = { template: 'Order {id}: {content}', start: [{ id: 7, content: '2 coffees.' }, { id: 8, content: '1 tea.' }] };

const ordersSite: Site = {
  id: 'orders',
  names: [],
  notFoundBody: NOT_FOUND,
  orders: ORDERS,
  pages: [
    { path: '/orders', methods: ['GET'], handler: { kind: 'order-read' } },
    { path: '/orders', methods: ['POST'], handler: { kind: 'order-create' } },
    { path: '/orders', methods: ['PUT'], handler: { kind: 'order-replace' } },
    { path: '/hello', methods: ['GET'], handler: { kind: 'fixed', body: 'Hello.' } },
  ],
};

const start: Orders = ORDERS!.start;
const ask = (method: HttpMethod, target: string, body?: string, orders: Orders = start, site: Site = ordersSite) =>
  answerRequest(site, orders, requestOf({ method, url: `http://app.example${target}`, ...(body !== undefined && { body }) }));

describe('answerRequest', () => {
  it('a get of an order that exists answers 200 with its body', () => {
    const { response } = ask('GET', '/orders?id=7');
    expect(response).toMatchObject({ statusCode: 200, body: 'Order 7: 2 coffees.' });
    expect(ask('GET', '/orders?id=8').response.body).toBe('Order 8: 1 tea.');
  });

  it('a fixed page answers 200 with its body', () => {
    expect(ask('GET', '/hello').response).toMatchObject({ statusCode: 200, body: 'Hello.' });
  });

  it('an order that does not exist answers 404', () => {
    for (const target of ['/orders?id=99', '/orders?id=abc', '/orders']) expect(ask('GET', target).response).toMatchObject({ statusCode: 404, body: NOT_FOUND });
    expect(ask('PUT', '/orders?id=99', 'x').response.statusCode).toBe(404);
  });

  it('a path that is not served answers 404', () => {
    expect(ask('GET', '/order?id=7').response).toMatchObject({ statusCode: 404, body: NOT_FOUND });
    expect(ask('GET', '/').response.statusCode).toBe(404);
  });

  it('a method that a path does not accept answers 404', () => {
    expect(ask('POST', '/hello', 'x').response.statusCode).toBe(404);
    expect(ask('PUT', '/hello', 'x').response.statusCode).toBe(404);
  });

  it('a post creates the next order and a second post creates another', () => {
    const first = ask('POST', '/orders', 'item=coffee');
    expect(first.response).toMatchObject({ statusCode: 200, body: 'Order 9: item=coffee' });
    const second = ask('POST', '/orders', 'item=coffee', first.orders);
    expect(second.response).toMatchObject({ statusCode: 200, body: 'Order 10: item=coffee' });
    expect(ask('GET', '/orders?id=9', undefined, second.orders).response.body).toBe('Order 9: item=coffee');
    expect(ask('GET', '/orders?id=10', undefined, second.orders).response.body).toBe('Order 10: item=coffee');
  });

  it('a put leaves the order as its body says and a second put leaves it the same', () => {
    const first = ask('PUT', '/orders?id=7', 'item=tea');
    expect(first.response).toMatchObject({ statusCode: 200, body: 'Order 7: item=tea' });
    const second = ask('PUT', '/orders?id=7', 'item=tea', first.orders);
    expect(second.response.body).toBe(first.response.body);
    expect(second.orders).toEqual(first.orders);
    expect(first.orders.map(({ id }) => id)).toEqual([7, 8]);
    expect(ask('GET', '/orders?id=8', undefined, second.orders).response.body).toBe('Order 8: 1 tea.');
  });

  it('the orders it receives are left untouched', () => {
    const before = structuredClone(start);
    ask('POST', '/orders', 'x');
    ask('PUT', '/orders?id=7', 'x');
    expect(start).toEqual(before);
  });

  it('a body with a dollar sign reaches the order as it is', () => {
    expect(ask('POST', '/orders', "$& $'").response.body).toBe("Order 9: $& $'");
  });
});

describe('chooseSite', () => {
  const shop: Site = { id: 'shop', names: ['www.shop.example'], pages: [], notFoundBody: '' };
  const blog: Site = { id: 'blog', names: ['blog.shop.example', 'news.shop.example'], pages: [], notFoundBody: '' };
  const web: WebService = { sites: [shop, blog], defaultSiteId: 'shop' };

  it('the site is chosen by the name of the host header', () => {
    expect(chooseSite(web, 'blog.shop.example')).toEqual({ site: blog, named: true });
    expect(chooseSite(web, 'NEWS.shop.example')).toEqual({ site: blog, named: true });
  });

  it('a name or an ip that no site has falls to the default site', () => {
    expect(chooseSite(web, 'other.shop.example')).toEqual({ site: shop, named: false });
    expect(chooseSite(web, '198.51.100.60')).toEqual({ site: shop, named: false });
    expect(chooseSite({ ...web, defaultSiteId: 'blog' }, 'other.shop.example')).toEqual({ site: blog, named: false });
  });
});
