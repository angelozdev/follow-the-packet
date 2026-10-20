import { defineIncident } from '@/levels/contract/incident';
import {
  ADDRESS,
  CONCEPT,
  HOSTNAME,
  IP,
  LESSON,
  MESSAGE,
  NAME,
  NAMES_PIECES,
  NAME_SERVERS,
  ORIGIN,
  PORT,
  SERVER,
  TASK,
  answerTaskFrom,
  sendMove,
  sendTask,
} from '@/levels/02-ports-and-names/shared';

export default defineIncident({
  id: '02-10',
  chapter: 2,
  order: 10,
  title: 'Preguntar por un nombre',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['domain-name', 'dns', 'dns-query', 'resolver', 'udp', 'dig', 'dhcp'],
  changes: NAME_SERVERS,
  shown: NAMES_PIECES,
  report: `Ahora ${NAME.you} puede usar un {{domain-name|nombre de dominio}}, como ${HOSTNAME.www}, en vez de una {{ip-address|IP}}. {{dns}} es el sistema que convierte ese nombre en una {{ip-address|IP}}. Para eso, ${NAME.you} le hace una {{dns-query|consulta DNS}} a un servidor {{dns}}: una pregunta por ese nombre. Ese servidor es su {{resolver}}. Es ${NAME.resolver}, en ${IP.resolver}. Apareció en «Ajustes de red» de ${NAME.you} porque se lo prestó {{dhcp}}. Haz un {{dig}} a ${HOSTNAME.www} y un {{ping}} al mismo nombre. Un {{ping}} necesita una {{ip-address|IP}}: si le das un nombre, primero pregunta por él. En este juego, cada pregunta sale de un {{source-port|puerto de origen}} nuevo. Para ver el servidor, abre ${NAME.you} y su pestaña «Ajustes de red».`,
  tasks: [
    answerTaskFrom(ORIGIN.you, TASK.digWww, `Que el {{dig}} a ${HOSTNAME.www} vuelva con ${IP.server}.`, MESSAGE.dig.id, ADDRESS.www.id, IP.server),
    sendTask(TASK.pingWww, `Que el {{ping}} a ${HOSTNAME.www} vuelva.`, MESSAGE.ping.id, ADDRESS.www.id, 'replied', SERVER.internet.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.www], message: [MESSAGE.dig, MESSAGE.ping] },
  hints: [
    'Compara la caja de este {{dig}} con la de un {{nc}} de «Abrir una conexión».',
    'Mira cuántos mensajes hay antes de la respuesta.',
  ],
  question: '¿Por qué {{dig}} no hizo el {{handshake|saludo de tres pasos}} antes de preguntar?',
  explanation: [
    {
      text: 'Porque {{dns}} no usa {{port|puertos}}.',
      feedback: `La {{dns-query|consulta DNS}} va al {{port|puerto}} ${PORT.dns} del {{resolver}}: la caja del {{dig}} lo muestra. {{dns}} sí usa {{port|puertos}}. Lo que no hubo fue una {{connection|conexión}} que abrir, porque la consulta va por {{udp}}, que no abre ninguna.`,
      correct: false,
    },
    {
      text: 'Porque usa {{udp|UDP}}, que manda cada mensaje suelto.',
      feedback: `{{udp}} manda cada mensaje suelto y no abre ninguna {{connection|conexión}}. El {{handshake|saludo de tres pasos}} es la forma en que {{tcp}} abre una, así que aquí no hay. En la caja del {{dig}} hay un mensaje de ida, la {{dns-query|consulta DNS}}, y uno de vuelta, la respuesta. Una {{dns-query|consulta DNS}} suele ir por {{udp}}. El servidor también escucha en {{tcp}}, pero ninguna consulta de este juego va por ahí.`,
      correct: true,
    },
    {
      text: 'Porque el {{resolver}} ya tenía una {{connection|conexión}} abierta contigo.',
      feedback: `{{udp}} no tiene {{connection|conexión}}: no hay ninguna abierta ni nada que mantener. ${NAME.you} mandó un mensaje suelto y el {{resolver}} contestó con otro.`,
      correct: false,
    },
  ],
  solution: [sendMove(ADDRESS.www.id, MESSAGE.dig.id), sendMove(ADDRESS.www.id, MESSAGE.ping.id)],
  takeaway: `Un {{domain-name|nombre de dominio}}, como ${HOSTNAME.www}, es un nombre legible, y {{dns}} lo convierte en una {{ip-address|IP}}. ${NAME.you} pregunta a su {{resolver}}, el servidor {{dns}} que le prestó {{dhcp}}, con una {{dns-query|consulta DNS}}. Si el {{resolver}} no conoce la respuesta, la busca por ti. Esa consulta suele viajar por {{udp}} al {{port|puerto}} ${PORT.dns}: un mensaje de ida y otro de vuelta, sin {{handshake|saludo de tres pasos}}. {{dig}} hace esa consulta y muestra la respuesta completa. Un {{ping}} a un nombre manda primero su {{dns-query|consulta DNS}} y, cuando la respuesta vuelve, sale el {{ping}}. En este juego, cada consulta, la de un {{ping}} y la de un {{dig}}, sale de un {{source-port|puerto de origen}} nuevo: por eso la segunda no repite el de la primera. Como el {{resolver}} está fuera de la oficina, ${NAME.router} la traduce y deja una fila en la {{translation-table|tabla de traducciones}}. El {{ping}} en sí no deja fila: {{icmp}} no usa {{port|puertos}}, y en esta tabla cada fila lleva uno. Los nombres de este juego, como ${HOSTNAME.www}, son ficticios: ninguno existe en el {{dns}} real.`,
});
