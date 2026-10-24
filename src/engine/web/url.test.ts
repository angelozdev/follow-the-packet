import { describe, expect, it } from 'vitest';
import { hostHeaderOf, isWebUrl, parseUrl, targetOf } from './url';

describe('parseUrl', () => {
  it('a url without a port gets 80 for http and 443 for https', () => {
    expect(parseUrl('http://shop.example/').port).toBe(80);
    expect(parseUrl('https://shop.example/').port).toBe(443);
    expect(parseUrl('http://shop.example:443/').port).toBe(443);
    expect(parseUrl('https://shop.example:80/').port).toBe(80);
  });

  it('a url keeps its path and its query string apart', () => {
    const url = parseUrl('http://localhost:3000/orders?id=7&kind=a');
    expect(url).toEqual({ scheme: 'http', host: 'localhost', port: 3000, path: '/orders', query: 'id=7&kind=a' });
    expect(parseUrl('http://localhost:3000')).toEqual({ scheme: 'http', host: 'localhost', port: 3000, path: '/' });
  });

  it('a url whose host is an ip keeps the ip as host', () => {
    expect(parseUrl('http://198.51.100.60/').host).toBe('198.51.100.60');
  });

  it('a fragment is not part of the url', () => {
    const url = parseUrl('http://shop.example/orders?id=7#top');
    expect(url).toEqual({ scheme: 'http', host: 'shop.example', port: 80, path: '/orders', query: 'id=7' });
    expect(targetOf(url)).toBe('/orders?id=7');
  });

  it('throws on a url that is not an absolute http or https url', () => {
    for (const value of ['shop.example', '/orders', 'ftp://shop.example/']) {
      expect(isWebUrl(value)).toBe(false);
      expect(() => parseUrl(value)).toThrow();
    }
    expect(isWebUrl('https://shop.example/')).toBe(true);
  });
});

describe('hostHeaderOf', () => {
  it('names the host, and the port only when it is not the default of the scheme', () => {
    expect(hostHeaderOf(parseUrl('http://shop.example/'))).toBe('shop.example');
    expect(hostHeaderOf(parseUrl('http://shop.example:80/'))).toBe('shop.example');
    expect(hostHeaderOf(parseUrl('http://localhost:3000/'))).toBe('localhost:3000');
    expect(hostHeaderOf(parseUrl('https://shop.example:443/'))).toBe('shop.example');
    expect(hostHeaderOf(parseUrl('https://shop.example:80/'))).toBe('shop.example:80');
  });
});
