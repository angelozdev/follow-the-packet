import { CLOCK_TEXT } from '@/copy';
import { RECORD_TTL } from '@/engine';
import { defineIncident } from '@/levels/contract/incident';
import {
  ADDRESS,
  CACHE_PIECES,
  CONCEPT,
  HOSTNAME,
  IP,
  LESSON,
  MESSAGE,
  MOVED_SITE,
  NAME,
  OLD_ANSWER_SECONDS,
  ORIGIN,
  TASK,
  WAIT,
  answerTaskFrom,
  sendMove,
  waitMove,
} from '@/levels/02-ports-and-names/shared';

const SECONDS_PER_MINUTE = 60;

export default defineIncident({
  id: '02-12',
  chapter: 2,
  order: 12,
  title: 'Todavía la vieja IP',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['dns-cache', 'dns-ttl'],
  changes: MOVED_SITE,
  shown: CACHE_PIECES,
  report: `Lucía mudó el sitio a otro servidor, ${NAME.freshServer}, con la {{ip-address|IP}} ${IP.freshServer}. Después cambió el registro de ${HOSTNAME.www} en ${NAME.authoritative}: ahora apunta a esa {{ip-address|IP}}. Antes de la mudanza, ${NAME.resolver}, tu {{resolver}}, ya había contestado una pregunta por ${HOSTNAME.www}. Haz un {{dig}} a ${HOSTNAME.www} y mira qué {{ip-address|IP}} contesta. El tiempo del juego solo pasa cuando tú esperas, con las fichas de «${CLOCK_TEXT.title}».`,
  tasks: [answerTaskFrom(ORIGIN.you, TASK.digNewIp, `Que el {{dig}} a ${HOSTNAME.www} vuelva con ${IP.freshServer}.`, MESSAGE.dig.id, ADDRESS.www.id, IP.freshServer)],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.www], message: [MESSAGE.dig], clock: { steps: [WAIT.oneMinute, WAIT.fiveMinutes] } },
  hints: ['Mira los segundos que quedan en la caja.', 'Espera a que venza la {{dns-cache|caché}} y repite el {{dig}}.'],
  question: '¿Por qué {{dig}} seguía dando la {{ip-address|IP}} vieja aunque el registro ya había cambiado?',
  explanation: [
    {
      text: 'Porque el {{authoritative-server|servidor autoritativo}} todavía no guardó el cambio de la {{ip-address|IP}} del sitio.',
      feedback: `${NAME.authoritative} ya tenía el registro nuevo desde el principio: cuando ${NAME.resolver} le preguntó de nuevo, contestó ${IP.freshServer}. La {{ip-address|IP}} vieja no venía de ahí, sino de una respuesta que ${NAME.resolver} ya tenía guardada.`,
      correct: false,
    },
    {
      text: 'Porque el {{ttl|TTL}} de {{ip-address|IP}} todavía no llegó a 0.',
      feedback: `Es otro {{ttl|TTL}}. El {{ttl|TTL}} de {{ip-address|IP}} va en el encabezado de un {{packet|paquete}} y cada router le resta al menos 1: cuenta {{hop|saltos}}. El {{dns-ttl|TTL de DNS}} viene en la respuesta y cuenta segundos. La caja decía «quedan N s»: eran segundos, no saltos.`,
      correct: false,
    },
    {
      text: `Porque ${NAME.resolver} guarda la respuesta en {{dns-cache|caché}} hasta que vence su {{dns-ttl|TTL}}.`,
      feedback: `${NAME.resolver} guardó en su {{dns-cache|caché}} la respuesta de antes de la mudanza, y la da mientras no venza su {{dns-ttl|TTL de DNS}}: los segundos que una respuesta puede quedar guardada. La caja decía cuántos quedaban. Cuando se acabaron, el siguiente {{dig}} ya no encontró la respuesta vieja en la {{dns-cache|caché}}: ${NAME.resolver} preguntó a ${NAME.authoritative} y recibió ${IP.freshServer}.`,
      correct: true,
    },
  ],
  solution: [sendMove(ADDRESS.www.id, MESSAGE.dig.id), waitMove(WAIT.fiveMinutes.seconds), sendMove(ADDRESS.www.id, MESSAGE.dig.id)],
  takeaway: `Un {{resolver}} guarda en su {{dns-cache|caché DNS}} las respuestas que da, para no preguntar de nuevo lo mismo. Cada respuesta trae su {{dns-ttl|TTL de DNS}}: los segundos que puede seguir guardada. Mientras no venza, ${NAME.resolver} contesta lo que tiene guardado, aunque el registro de ${NAME.authoritative} ya haya cambiado. Por eso el {{dig}} daba la {{ip-address|IP}} vieja, ${IP.server}, con los segundos que quedaban en la caja. Cada minuto de espera le quita ${SECONDS_PER_MINUTE} a esos segundos, y a los ${OLD_ANSWER_SECONDS} s ya no queda ninguno. El siguiente {{dig}} ya no encontró la respuesta vieja en la {{dns-cache|caché}}: ${NAME.resolver} preguntó a ${NAME.authoritative} y recibió ${IP.freshServer}, con su {{dns-ttl|TTL}} entero, ${RECORD_TTL} s. El {{dns-ttl|TTL de DNS}} se cuenta en segundos y el {{ttl|TTL}} de {{ip-address|IP}} cuenta {{hop|saltos}}: no son lo mismo. Un {{dns-ttl|TTL}} es un máximo, no una obligación: este juego guarda la respuesta todo ese tiempo, pero un {{resolver}} real puede guardarla menos. La pestaña «Tablas» de ${NAME.resolver} mostraba lo que tenía guardado y los segundos que le quedaban.`,
});
