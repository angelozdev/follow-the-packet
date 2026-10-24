import { word, type TermText } from '@/copy/term-text';
import type { TermId } from '@/copy/terms';
import { CURL_TIMEOUT_CODE } from '@/copy/tools/curl-output';

type Known = ReadonlySet<TermId>;

/** The parts of a url as the box writes them: the scheme, the host (a name or an IP), the port and whether the url wrote it, the path and the query string. */
export interface UrlParts {
  scheme: string;
  host: string;
  hostIsIp: boolean;
  port: number;
  portWritten: boolean;
  path: string;
  query?: string;
}

export const WEB_BOX_TEXT = {
  url: {
    label: '{{url}}',
    lines: ({ scheme, host, hostIsIp, port, portWritten, path, query }: UrlParts, known: Known): TermText[] => [
      `Esquema: ${scheme}`,
      `${hostIsIp ? word(known, 'ip-address', 'IP') : 'Nombre'}: ${host}`,
      portWritten ? `${word(known, 'port', 'Puerto')}: ${port}` : `${word(known, 'port', 'Puerto')}: ${port} · la URL no lo escribe: ${scheme} usa su ${word(known, 'default-port', 'puerto por defecto')}, el ${port}`,
      `${word(known, 'url-path', 'Path')}: ${path}`,
      ...(query === undefined ? [] : [`${word(known, 'query-string', 'Query string')}: ${query}`]),
    ],
  },
  request: '{{http-request|Petición HTTP}}',
  response: '{{http-response|Respuesta HTTP}}',
  header: (name: string, value: string): TermText => `${name}: ${value}`,
  body: (body: string): TermText => `Cuerpo: ${body}`,
  notes: {
    browserRequest: 'Un navegador real manda más cabeceras. El del juego manda solo esta.',
    response: 'Un servidor real manda más cabeceras. El del juego manda solo estas.',
  },
  curl: '{{curl}}',
  curlGaveUp: (seconds?: number): TermText => `curl esperó ${seconds === undefined ? '' : `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'} `}y se rindió (código ${CURL_TIMEOUT_CODE}).`,
} as const;

export const BROWSER_TEXT = {
  title: (device: TermText): TermText => `{{browser|Navegador}} de ${device}`,
  address: 'Dirección',
  open: 'Abrir',
  sees: 'Lo que ve el navegador',
  refused: 'La conexión se rechazó',
  noConnection: 'No se pudo conectar',
  noPage: 'El servidor no contestó con ninguna página',
} as const;

export const SITES_TEXT = {
  title: (owner: TermText): TermText => `{{virtual-host|Sitios}} de ${owner}`,
  name: 'Nombre',
  serves: 'Qué sirve',
  byDefault: (names: string): TermText => `${names} · sitio por defecto`,
  anyName: 'cualquier nombre',
  add: 'Agregar sitio',
  empty: 'Este servidor no tiene sitios.',
} as const;
