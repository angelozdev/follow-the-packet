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

const STATUS_TERM: Readonly<Partial<Record<number, TermId>>> = { 200: 'status-200', 400: 'status-400', 401: 'status-401', 403: 'status-403', 404: 'status-404' };

const STATUS_CLASS: Readonly<Partial<Record<number, (known: Known) => TermText>>> = {
  2: () => 'Clase 2xx: la petición se cumplió.',
  4: (known) => `Clase ${word(known, 'client-error', '4xx')}: la petición, tal como llegó, no se puede cumplir.`,
};

/** Writes a status code as the player reads it: the term that names it (`404 Not Found`) once the player knows it, and the number alone before. */
export function statusCodeName(statusCode: number, known: Known): TermText {
  const term = STATUS_TERM[statusCode];
  return term !== undefined && known.has(term) ? `{{${term}}}` : String(statusCode);
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
  status: {
    label: '{{status-code|Código de estado}}',
    lines: (statusCode: number, known: Known): TermText[] => {
      const classLine = STATUS_CLASS[Math.trunc(statusCode / 100)];
      return [statusCodeName(statusCode, known), ...(classLine ? [classLine(known)] : [])];
    },
  },
  generatedBy: {
    label: 'Quién lo generó',
    line: (owner: TermText): TermText => `La app de ${owner}`,
  },
  header: (name: string, value: string): TermText => `${name}: ${value}`,
  notes: {
    browserRequest: 'Un navegador real manda más cabeceras. El del juego manda solo esta.',
    browserRequestSeveral: 'Un navegador real manda más cabeceras. El del juego manda solo estas.',
    response: 'Un servidor real manda más cabeceras. El del juego manda solo estas.',
  },
  browserLoginBox: (statusCode: TermText): TermText => `Ante un ${statusCode} con WWW-Authenticate, un navegador real abre un cuadro para escribir el usuario y la clave. El del juego no lo abre.`,
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
  user: 'Usuario',
  signIn: 'Iniciar sesión',
  memory: {
    title: 'Lo que recuerda',
    caption: 'Lo que recuerda el navegador',
    rows: 'Cada fila es una {{cookie}}.',
    columns: { site: 'sitio', name: 'nombre', value: 'valor' },
    empty: 'Todavía no guarda nada.',
  },
} as const;

export const URL_STRIP_TEXT = {
  name: 'Dirección',
  parts: { scheme: 'Esquema', host: 'Nombre', port: 'Puerto', path: 'Path', query: 'Query string' },
  separators: { host: '://', port: ':' },
  none: { port: 'sin puerto', query: 'sin query' },
  query: (query: string): string => `?${query}`,
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
