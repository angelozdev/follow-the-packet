import { describe, expect, it } from 'vitest';
import { requestOf, responseOf } from './messages';

const get = (url: string) => requestOf({ method: 'GET', url });

describe('requestOf', () => {
  it('the request line has the method, the path with its query string and the version', () => {
    expect(get('http://shop.example/orders?id=7').startLine).toBe('GET /orders?id=7 HTTP/1.1');
    expect(get('http://shop.example').startLine).toBe('GET / HTTP/1.1');
  });

  it('the request carries a Host header with the name of the url, and the port when it is not the default', () => {
    expect(get('http://shop.example/').headers).toEqual({ Host: 'shop.example' });
    expect(get('http://shop.example:80/').headers).toEqual({ Host: 'shop.example' });
    expect(get('http://localhost:3000/').headers).toEqual({ Host: 'localhost:3000' });
    expect(get('http://198.51.100.60/').headers).toEqual({ Host: '198.51.100.60' });
    expect(get('http://blog.shop.example/').host).toBe('blog.shop.example');
  });

  it('the fragment is dropped before the request is built', () => {
    const request = get('http://shop.example/orders?id=7#top');
    expect(request).toMatchObject({ startLine: 'GET /orders?id=7 HTTP/1.1', path: '/orders', query: 'id=7' });
    expect(JSON.stringify(request)).not.toContain('#');
  });

  it('a body travels with its length in bytes and the headers the message brings', () => {
    const request = requestOf({ method: 'POST', url: 'http://shop.example/orders', body: 'item=café', headers: { 'Content-Type': 'text/plain' } });
    expect(request.body).toBe('item=café');
    expect(request.headers).toEqual({ Host: 'shop.example', 'Content-Type': 'text/plain', 'Content-Length': '10' });
    expect(requestOf({ method: 'GET', url: 'http://shop.example/' })).not.toHaveProperty('body');
  });
});

describe('responseOf', () => {
  it('the response line has the version, the code and its phrase', () => {
    expect(responseOf(200, 'x').startLine).toBe('HTTP/1.1 200 OK');
    expect(responseOf(404, 'x').startLine).toBe('HTTP/1.1 404 Not Found');
  });

  it('the response carries only Content-Type and Content-Length', () => {
    const response = responseOf(200, 'Order 7');
    expect(response).toMatchObject({ statusCode: 200, body: 'Order 7' });
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': '7' });
  });
});

describe('the length of a body', () => {
  it('the length of a body counts bytes, not characters', () => {
    expect('café'.length).toBe(4);
    expect(responseOf(200, 'café').headers['Content-Length']).toBe('5');
    expect(responseOf(200, '').headers['Content-Length']).toBe('0');
    expect(requestOf({ method: 'POST', url: 'http://shop.example/', body: 'café' }).headers['Content-Length']).toBe('5');
  });
});
