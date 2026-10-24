import { describe, expect, it } from 'vitest';
import { toPlainText, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { OFFICE_FLOORS, webSendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { inspect } from '@/game/view/inspection';
import { PIECE_ID } from '@/game/view/piece-id';

const WEB = webSendIncident();
const web = startSession([WEB], WEB.id);
const opened = sessionReducer(web, { type: 'placeRule', firewallId: 'fw-lucia', whatId: 'tcp-3000', fromId: 'you' });
const NEW_LABELS = ['URL', 'Petición HTTP', 'Respuesta HTTP', 'curl'];

function without(session: Session, ...terms: TermId[]): Session {
  return { ...session, known: new Set([...session.known].filter((term) => !terms.includes(term))) };
}

function sentAs(session: Session, from: string, to: string, message: string): Session {
  return sessionReducer(session, { type: 'sendPacket', fromId: from, toId: to, messageId: message });
}

function boxOf(session: Session, from: string, to: string, message: string): string[][] {
  const box = inspect(session, PIECE_ID.packet(`sent-${from}-${to}-${message}`));
  return (box?.fields ?? []).map((field) => [toPlainText(field.label), ...field.lines.map(toPlainText), ...(field.notes ?? []).map((note) => `nota: ${toPlainText(note)}`)]);
}

const field = (box: string[][], label: string) => box.find(([own]) => own === label);

describe('the box of a curl or a browser: the url', () => {
  it('the box shows the url in its parts behind the term url', () => {
    const box = boxOf(sentAs(web, 'lucia', 'app-7', 'curl'), 'lucia', 'app-7', 'curl');
    expect(field(box, 'URL')).toEqual(['URL', 'Esquema: http', 'Nombre: localhost', 'Puerto: 3000', 'Path: /pedidos', 'Query string: id=7']);
    expect(box.map(([label]) => label).slice(0, 2)).toEqual(['Qué es', 'URL']);
    expect(field(boxOf(without(sentAs(web, 'lucia', 'app-7', 'curl'), 'url'), 'lucia', 'app-7', 'curl'), 'URL')).toBeUndefined();
  });

  it('writes the port as the url wrote it, and says the default port of the scheme when the url wrote none', () => {
    expect(field(boxOf(sentAs(web, 'lucia', 'app-80', 'curl'), 'lucia', 'app-80', 'curl'), 'URL')).toContain('Puerto: 80');
    const shop = field(boxOf(sentAs(web, 'you', 'shop', 'curl'), 'you', 'shop', 'curl'), 'URL');
    expect(shop).toEqual(['URL', 'Esquema: http', 'Nombre: www.lucia.example', 'Puerto: 80 · la URL no lo escribe: http usa su puerto por defecto, el 80', 'Path: /']);
  });

  it('calls an IP an IP and not a name, and leaves the query string out when the url has none', () => {
    const orders = field(boxOf(sentAs(opened, 'you', 'orders', 'curl'), 'you', 'orders', 'curl'), 'URL');
    expect(orders).toContain(`IP: ${OFFICE_FLOORS.floor1.lucia}`);
    expect(orders?.some((line) => line.startsWith('Query string'))).toBe(false);
  });
});

describe('the box of a curl or a browser: the request and the response', () => {
  it('the box shows the request and the response behind their terms', () => {
    const session = sentAs(web, 'you', 'shop', 'curl');
    const box = boxOf(session, 'you', 'shop', 'curl');
    expect(field(box, 'Petición HTTP')).toEqual(['Petición HTTP', 'GET / HTTP/1.1', 'Host: www.lucia.example', 'User-Agent: curl/8.21.0', 'Accept: */*']);
    expect(field(box, 'Respuesta HTTP')).toEqual([
      'Respuesta HTTP',
      'HTTP/1.1 200 OK',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Length: 9',
      'Cuerpo: La tienda',
      'nota: Un servidor real manda más cabeceras. El del juego manda solo estas.',
    ]);
    const labels = box.map(([label]) => label);
    expect(labels.indexOf('Saludo de tres pasos')).toBeLessThan(labels.indexOf('Petición HTTP'));
    expect(labels.indexOf('Petición HTTP')).toBeLessThan(labels.indexOf('Respuesta HTTP'));
    expect(labels.indexOf('Respuesta HTTP')).toBeLessThan(labels.indexOf('Resultado'));
    expect(field(boxOf(without(session, 'http-request'), 'you', 'shop', 'curl'), 'Petición HTTP')).toBeUndefined();
    expect(field(boxOf(without(session, 'http-response'), 'you', 'shop', 'curl'), 'Respuesta HTTP')).toBeUndefined();
    expect(field(boxOf(without(session, 'http-response'), 'you', 'shop', 'curl'), 'Petición HTTP')).toBeDefined();
  });

  it('a post shows its length in bytes, its content type and its body, and the response shows the order it made', () => {
    const box = boxOf(sentAs(opened, 'you', 'orders', 'curl-post'), 'you', 'orders', 'curl-post');
    expect(field(box, 'Petición HTTP')).toEqual([
      'Petición HTTP',
      'POST /pedidos HTTP/1.1',
      `Host: ${OFFICE_FLOORS.floor1.lucia}:3000`,
      'User-Agent: curl/8.21.0',
      'Accept: */*',
      'Content-Length: 11',
      'Content-Type: application/x-www-form-urlencoded',
      'Cuerpo: item=coffee',
    ]);
    expect(field(box, 'Respuesta HTTP')).toContain('Cuerpo: Pedido 9: item=coffee');
  });

  it('a path that is not served shows the 404 and its body', () => {
    const box = boxOf(sentAs(opened, 'you', 'orders', 'curl'), 'you', 'orders', 'curl');
    expect(field(box, 'Respuesta HTTP')).toEqual(expect.arrayContaining(['HTTP/1.1 404 Not Found', 'Cuerpo: No hay nada en ese camino.']));
  });

  it('the box of the browser shows the Host header and says the browser of the game sends only that one', () => {
    const box = boxOf(sentAs(web, 'you', 'blog', 'browser'), 'you', 'blog', 'browser');
    expect(field(box, 'Petición HTTP')).toEqual(['Petición HTTP', 'GET / HTTP/1.1', 'Host: blog.lucia.example', 'nota: Un navegador real manda más cabeceras. El del juego manda solo esta.']);
    expect(field(box, 'Respuesta HTTP')).toContain('Cuerpo: La tienda');
  });

  it('shows no request when the connection never opened: a refusal, a firewall that drops', () => {
    for (const [from, to, message] of [['lucia', 'app-80', 'curl'], ['you', 'orders', 'curl-timeout']]) {
      const box = boxOf(sentAs(web, from, to, message), from, to, message);
      expect(field(box, 'Petición HTTP'), `${to} ${message}`).toBeUndefined();
      expect(field(box, 'Respuesta HTTP'), `${to} ${message}`).toBeUndefined();
      expect(field(box, 'URL'), `${to} ${message}`).toBeDefined();
    }
  });
});

describe('the words of the box', () => {
  it('names the request and the response as what they are and never calls them a packet', () => {
    const sends: [Session, string, string, string][] = [
      [web, 'you', 'shop', 'curl'],
      [web, 'you', 'blog', 'browser'],
      [web, 'lucia', 'app-80', 'curl'],
      [web, 'you', 'orders', 'curl-timeout'],
    ];
    for (const [session, from, to, message] of sends) {
      const box = boxOf(sentAs(session, from, to, message), from, to, message);
      const webFields = box.filter(([label]) => NEW_LABELS.includes(label));
      expect(webFields.length, `${to} ${message}`).toBeGreaterThan(0);
      expect(webFields.flat().filter((line) => /paquete|packet/i.test(line)), `${to} ${message}`).toEqual([]);
    }
  });
});

describe('the box of a curl that got no answer', () => {
  it('says curl waited and gave up with code 28, with the seconds of its option', () => {
    const box = boxOf(sentAs(web, 'you', 'orders', 'curl-timeout'), 'you', 'orders', 'curl-timeout');
    expect(field(box, 'curl')).toEqual(['curl', 'curl esperó 3 segundos y se rindió (código 28).']);
    expect(box.map(([label]) => label).indexOf('curl')).toBe(box.map(([label]) => label).indexOf('Resultado') + 1);
  });

  it('says it without the seconds when the curl has no option for the wait, and says nothing of it for the browser or an answered curl', () => {
    expect(field(boxOf(sentAs(web, 'you', 'orders', 'curl'), 'you', 'orders', 'curl'), 'curl')).toEqual(['curl', 'curl esperó y se rindió (código 28).']);
    expect(field(boxOf(sentAs(web, 'you', 'orders', 'browser'), 'you', 'orders', 'browser'), 'curl')).toBeUndefined();
    expect(field(boxOf(sentAs(web, 'you', 'shop', 'curl'), 'you', 'shop', 'curl'), 'curl')).toBeUndefined();
    expect(field(boxOf(without(sentAs(web, 'you', 'orders', 'curl-timeout'), 'curl'), 'you', 'orders', 'curl-timeout'), 'curl')).toBeUndefined();
  });
});

describe('a device of a VPC', () => {
  const chapter4 = startSession(INCIDENTS, '04-01');
  const everyTermKnown: Session = { ...chapter4, known: new Set([...chapter4.known, ...web.known]) };

  it('a device of a VPC shows none of the new fields', () => {
    const device = inspect(everyTermKnown, PIECE_ID.device('servidor2'));
    expect(device?.fields.length).toBeGreaterThan(0);
    const packet = inspect(everyTermKnown, everyTermKnown.runs[0].pieceId);
    expect(packet?.fields.length).toBeGreaterThan(0);
    for (const box of [device, packet]) expect((box?.fields ?? []).map((own) => toPlainText(own.label)).filter((label) => NEW_LABELS.includes(label))).toEqual([]);
  });
});

describe('the services of a device and the process each listens from', () => {
  const ORDERS = { id: 'orders-app', name: 'app de pedidos', running: true };
  const REPORTS = { id: 'reports-app', name: 'app de reportes', running: false };
  const withProcesses = (session: Session): Session => ({
    ...session,
    world: withDevice(session.world, 'lucia-laptop', {
      host: {
        ignoreIcmpEcho: false,
        processes: [ORDERS, REPORTS],
        services: [
          { protocol: 'tcp', port: 3000, listen: 'all', processId: ORDERS.id },
          { protocol: 'tcp', port: 3001, listen: 'all', processId: REPORTS.id },
          { protocol: 'tcp', port: 22, listen: 'loopback' },
        ],
      },
    }),
  });
  const services = (session: Session) => {
    const box = inspect(session, PIECE_ID.device('lucia-laptop'));
    return box?.fields.find((own) => toPlainText(own.label) === 'Servicios')?.lines.map(toPlainText);
  };

  it('a service lists the process it listens from', () => {
    expect(services(withProcesses(web))).toEqual(['TCP 3000 · escucha en todas las IPs · proceso app de pedidos', 'TCP 3001 · proceso app de reportes · detenido', 'TCP 22 · escucha solo en 127.0.0.1']);
  });

  it('names the process only once the player knows the term, and lists a service whose process stopped only then, because it does not listen', () => {
    expect(services(without(withProcesses(web), 'process'))).toEqual(['TCP 3000 · escucha en todas las IPs', 'TCP 22 · escucha solo en 127.0.0.1']);
    expect(services(without(withProcesses(web), 'listen-address'))).toEqual(['TCP 3000 · proceso app de pedidos', 'TCP 3001 · proceso app de reportes · detenido', 'TCP 22']);
  });

  it('a device whose services have no process lists them as it always did', () => {
    expect(services(web)).toEqual(['TCP 3000 · escucha en todas las IPs', 'TCP 22 · escucha en todas las IPs']);
  });
});
