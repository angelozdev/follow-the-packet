import { describe, expect, it } from 'vitest';
import { answerRequest, chooseSite, type Orders } from './app';
import { basicAuthorizationHeader } from './identity/basic-credential';
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

const NOT_A_NUMBER = 'The id is not a number.';
const checkingSite: Site = { ...ordersSite, orders: { ...ORDERS!, badIdBody: NOT_A_NUMBER } };

const ADMIN_PANEL = 'Admin panel.';
const accounts: NonNullable<Site['accounts']> = {
  users: [
    { name: 'lucia', password: 'pw-lucia', role: 'admin' },
    { name: 'marta', password: 'pw-marta', role: 'staff' },
  ],
  realm: 'admin',
  unauthorizedBody: 'Log in.',
  forbiddenBody: 'Not allowed.',
};
const guardedSite: Site = { ...ordersSite, accounts, pages: [...ordersSite.pages, { path: '/admin', methods: ['GET'], role: 'admin', handler: { kind: 'fixed', body: ADMIN_PANEL } }] };

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

  it('a post to the address of an order creates the next order like a post to the orders, since the query is not part of the route', () => {
    for (const target of ['/orders?id=7', '/orders?id=99', '/orders?id=abc', '/orders?other=1']) {
      const created = ask('POST', target, 'item=coffee');
      expect(created.response).toMatchObject({ statusCode: 200, body: 'Order 9: item=coffee' });
      expect(created.orders).toEqual([...start, { id: 9, content: 'item=coffee' }]);
    }
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

describe('an app that checks the id of an order', () => {
  const askChecking = (method: HttpMethod, target: string, body?: string) => ask(method, target, body, start, checkingSite);

  it('an app that checks the id answers 400 with its own body to an id that is not a number', () => {
    for (const target of ['/orders?id=abc', '/orders?id=', '/orders?id=7x', '/orders?id=-1']) expect(askChecking('GET', target).response, target).toMatchObject({ statusCode: 400, body: NOT_A_NUMBER });
  });

  it('a put with an id that is not a number answers 400 in an app that checks the id', () => {
    const refused = askChecking('PUT', '/orders?id=abc', 'item=tea');
    expect(refused.response).toMatchObject({ statusCode: 400, body: NOT_A_NUMBER });
    expect(refused.orders).toEqual(start);
  });

  it('an order that does not exist and a request with no id still answer 404 in an app that checks the id', () => {
    for (const [method, target] of [['GET', '/orders?id=99'], ['GET', '/orders'], ['GET', '/orders?other=1'], ['PUT', '/orders?id=99'], ['PUT', '/orders']] as const) {
      expect(askChecking(method, target, 'x').response, `${method} ${target}`).toMatchObject({ statusCode: 404, body: NOT_FOUND });
    }
  });

  it('an app that does not check the id answers 404 to an id that is not a number, as before', () => {
    for (const target of ['/orders?id=abc', '/orders?id=', '/orders?id=7x']) expect(ask('GET', target).response, target).toMatchObject({ statusCode: 404, body: NOT_FOUND });
    expect(ask('PUT', '/orders?id=abc', 'x').response.statusCode).toBe(404);
  });

  it('a post to an id that is not a number still creates an order in an app that checks the id, since a post does not read the id', () => {
    expect(askChecking('POST', '/orders?id=abc', 'item=coffee').response).toMatchObject({ statusCode: 200, body: 'Order 9: item=coffee' });
  });

  it('an id that is a number is read as before in an app that checks the id', () => {
    expect(askChecking('GET', '/orders?id=7').response).toMatchObject({ statusCode: 200, body: 'Order 7: 2 coffees.' });
    expect(askChecking('PUT', '/orders?id=7', 'item=tea').response).toMatchObject({ statusCode: 200, body: 'Order 7: item=tea' });
  });
});

describe('a page that asks for a role', () => {
  const askAdmin = (credential?: string, method: HttpMethod = 'GET') =>
    answerRequest(guardedSite, start, requestOf({ method, url: 'http://app.example/admin', ...(credential !== undefined && { headers: basicAuthorizationHeader(credential) }) }));

  it('a request with no credential to a protected path answers 401 with WWW-Authenticate', () => {
    const { response, denial } = askAdmin();
    expect(response).toMatchObject({ statusCode: 401, startLine: 'HTTP/1.1 401 Unauthorized', body: 'Log in.' });
    expect(response.headers['WWW-Authenticate']).toBe('Basic realm="admin"');
    expect(denial).toEqual({ kind: 'needs-login' });
  });

  it('a request with the credential of a user without the role answers 403', () => {
    const { response, denial } = askAdmin('marta:pw-marta');
    expect(response).toMatchObject({ statusCode: 403, startLine: 'HTTP/1.1 403 Forbidden', body: 'Not allowed.' });
    expect(response.headers).not.toHaveProperty('WWW-Authenticate');
    expect(denial).toEqual({ kind: 'forbidden', user: 'marta' });
  });

  it('a request with the credential of a user with the role answers 200', () => {
    const { response, denial } = askAdmin('lucia:pw-lucia');
    expect(response).toMatchObject({ statusCode: 200, body: ADMIN_PANEL });
    expect(denial).toBeUndefined();
  });

  it('a wrong password answers 401, and so does a user the site does not have', () => {
    for (const credential of ['marta:pw-lucia', 'lucia:wrong', 'nobody:pw-lucia']) expect(askAdmin(credential).response, credential).toMatchObject({ statusCode: 401, body: 'Log in.' });
  });

  it('repeating a request with the same credential gives the same 403', () => {
    const first = askAdmin('marta:pw-marta');
    expect(askAdmin('marta:pw-marta')).toEqual(first);
    expect(askAdmin('marta:pw-marta').orders).toBe(start);
  });

  it('a page with no role needs no credential, and a method the protected path does not accept is a 404 before any credential is asked', () => {
    expect(answerRequest(guardedSite, start, requestOf({ method: 'GET', url: 'http://app.example/orders?id=7' })).response.statusCode).toBe(200);
    expect(askAdmin(undefined, 'POST').response.statusCode).toBe(404);
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
