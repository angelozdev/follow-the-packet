import { describe, expect, it } from 'vitest';
import { TERMINAL_TEXT } from '@/copy';
import { commandGroups } from './command-groups';

const SHOP_URL = 'http://www.lucia.example/pedidos?id=7';
const LOOP = `for i in $(seq 20); do curl -i ${SHOP_URL}; done`;
const FULL_CURL = TERMINAL_TEXT.curl('http://192.168.1.11:3000/pedidos', { include: true, user: 'marta:clave marta', cookie: 'sesion=s1', request: 'PUT', data: 'item=café doble', connectTimeout: 3 });
const LINES = [
  TERMINAL_TEXT.ping('192.168.1.20'),
  TERMINAL_TEXT.ping('192.168.1.20', 64),
  TERMINAL_TEXT.traceroute('203.0.113.50'),
  TERMINAL_TEXT.nc('192.168.1.11', 3000),
  TERMINAL_TEXT.dig('www.lucia.example'),
  TERMINAL_TEXT.curl(SHOP_URL),
  FULL_CURL,
  TERMINAL_TEXT.packet('[[tu-laptop]]', '192.168.1.20'),
  TERMINAL_TEXT.handmade('{{ping|Echo Request}}', '192.168.1.20'),
  LOOP,
];

const groupTexts = (line: string) => commandGroups(line).map((group) => group.join(''));

describe('the groups of the command of a terminal', () => {
  it('the command of a terminal is split into groups that break only between words', () => {
    for (const line of LINES) expect(groupTexts(line).join(' '), line).toBe(line);
    expect(groupTexts(LOOP)).toEqual(['for', 'i', 'in', '$(seq 20);', 'do', 'curl -i', 'http://www.lucia.example/pedidos?id=7;', 'done']);
    expect(groupTexts(TERMINAL_TEXT.packet('[[tu-laptop]]', '192.168.1.20'))).toEqual(['paquete', 'de', '[[tu-laptop]]', 'a', '192.168.1.20']);
    expect(groupTexts(TERMINAL_TEXT.handmade('{{ping|Echo Request}}', '192.168.1.20'))).toEqual(['paquete', 'armado', 'a', 'mano:', '{{ping|Echo Request}}', '→', '192.168.1.20']);
  });

  it('a quoted word is one word even when it has spaces in it', () => {
    expect(groupTexts(FULL_CURL)).toEqual(['curl -i', "-u 'marta:clave marta'", '-b sesion=s1', '-X PUT', "-d 'item=café doble'", '--connect-timeout 3', 'http://192.168.1.11:3000/pedidos']);
  });

  it('an option is never split and curl -i stays in one group', () => {
    expect(groupTexts(TERMINAL_TEXT.curl(SHOP_URL, { include: true }))).toEqual(['curl -i', SHOP_URL]);
    expect(groupTexts(TERMINAL_TEXT.nc('192.168.1.11', 3000))).toEqual(['nc -vz', '-w 3', '192.168.1.11', '3000']);
    expect(groupTexts(TERMINAL_TEXT.ping('192.168.1.20', 64))).toEqual(['ping', '-t 64', '192.168.1.20']);
    expect(groupTexts(TERMINAL_TEXT.traceroute('203.0.113.50'))).toEqual(['traceroute -I', '203.0.113.50']);
    for (const group of LINES.flatMap(groupTexts)) expect(group, group).not.toMatch(/^-\S*$/);
  });

  it('a url offers a break before http:// and after the last slash of its path, and nowhere else', () => {
    expect(commandGroups(TERMINAL_TEXT.curl(SHOP_URL, { include: true }))).toEqual([['curl -i'], ['http://www.lucia.example/', 'pedidos?id=7']]);
    expect(commandGroups(TERMINAL_TEXT.curl('http://192.168.1.11:3000/api/pedidos/7'))).toEqual([['curl'], ['http://192.168.1.11:3000/api/pedidos/', '7']]);
    expect(commandGroups(TERMINAL_TEXT.curl('http://www.lucia.example/'))).toEqual([['curl'], ['http://www.lucia.example/']]);
    expect(commandGroups(TERMINAL_TEXT.curl('http://www.lucia.example'))).toEqual([['curl'], ['http://www.lucia.example']]);
    expect(commandGroups(TERMINAL_TEXT.curl('http://www.lucia.example/?id=7'))).toEqual([['curl'], ['http://www.lucia.example/', '?id=7']]);
    expect(commandGroups(TERMINAL_TEXT.dig('www.lucia.example'))).toEqual([['dig'], ['www.lucia.example']]);
    expect(commandGroups(LOOP).filter((group) => group.length > 1)).toEqual([['http://www.lucia.example/', 'pedidos?id=7;']]);
  });
});
