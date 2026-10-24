import { defineIncident } from '@/levels/contract/incident';
import { HOSTNAME, IP, MESSAGE, NAME, ORIGIN, SHOP_SERVER, SITE_BODY, SITE_CHIP, SITE_PIECES, SITE_URL, SITES_TABLE, TASK, bodyTask, sendMoveFrom, siteMove } from '@/levels/03-the-web-inside/shared';

const CURL_INCLUDE = { origin: ORIGIN.you, messageId: MESSAGE.curlInclude.id };

export default defineIncident({
  id: '03-04',
  chapter: 3,
  order: 4,
  title: 'Un servidor, varios sitios',
  role: 'defender',
  mechanic: 'send',
  introduces: ['http-header', 'host-header', 'virtual-host'],
  changes: [SHOP_SERVER],
  shown: SITE_PIECES,
  report: `Lucía instaló un {{web-server|servidor web}} en ${NAME.freshServer} con un solo sitio: la tienda. ${HOSTNAME.blog} es un alias de ${HOSTNAME.www}: los dos nombres llevan a ${IP.freshServer}, y blog muestra la tienda. Con -i, {{curl}} muestra la respuesta entera, no solo su cuerpo. Pide con {{curl}} -i y con el {{browser|navegador}} a www, a blog y a la {{ip-address|IP}}, y lee en la caja cada petición. Agrega el sitio del blog en la tarjeta «Sitios» de ${NAME.freshServer}.`,
  tasks: [
    bodyTask(TASK.shopByName, `Con {{curl}} -i, que ${HOSTNAME.www} reciba la tienda.`, SITE_URL.www.id, SITE_BODY.shop, CURL_INCLUDE),
    bodyTask(TASK.blogByName, `Con {{curl}} -i, que ${HOSTNAME.blog} reciba el blog.`, SITE_URL.blog.id, SITE_BODY.blog, CURL_INCLUDE),
    bodyTask(TASK.shopByIp, `Con {{curl}} -i, que la {{ip-address|IP}} ${IP.freshServer} sola reciba el sitio por defecto, la tienda.`, SITE_URL.ip.id, SITE_BODY.shop, CURL_INCLUDE),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [SITE_URL.www, SITE_URL.blog, SITE_URL.ip], message: [MESSAGE.curlInclude, MESSAGE.browser], tables: [SITES_TABLE] },
  hints: ['La {{ip-address|IP}} y el {{port|puerto}} son iguales para los dos nombres.', 'Fíjate en la {{host-header|cabecera Host}} de la caja.'],
  question: `${HOSTNAME.blog} es un alias de ${HOSTNAME.www}. ¿Cómo sabe ${NAME.freshServer} qué sitio dar?`,
  explanation: [
    {
      text: 'Por la {{ip-address|IP}}, que es distinta para cada sitio.',
      feedback: `La {{ip-address|IP}} es la misma para los dos nombres: ${IP.freshServer}. Con una sola IP, ${NAME.freshServer} no puede saber por ella qué sitio se le pide.`,
      correct: false,
    },
    {
      text: 'Por la {{host-header|cabecera Host}}, que lleva el nombre escrito en la {{url|URL}}.',
      feedback: `La petición a ${HOSTNAME.blog} llevó la cabecera Host con ${HOSTNAME.blog}, el nombre escrito en la {{url|URL}}, aunque sea un alias. ${NAME.freshServer} no tenía un sitio con ese nombre y dio su sitio por defecto, la tienda; con el sitio del blog agregado, la misma petición lo encontró. Un servidor que da varios sitios así los sirve como {{virtual-host|hosts virtuales}}.`,
      correct: true,
    },
    {
      text: 'Por el registro {{cname-record|CNAME}}.',
      feedback: `El {{cname-record|CNAME}} lo lee el {{dns|DNS}}, para dar la {{ip-address|IP}}. El {{web-server|servidor web}} de ${NAME.freshServer} no ve el DNS: solo recibe la petición, con su cabecera Host.`,
      correct: false,
    },
  ],
  solution: [
    siteMove(SITE_CHIP.name.blog, SITE_CHIP.serves.blog),
    sendMoveFrom(ORIGIN.you, SITE_URL.www.id, MESSAGE.curlInclude.id),
    sendMoveFrom(ORIGIN.you, SITE_URL.blog.id, MESSAGE.curlInclude.id),
    sendMoveFrom(ORIGIN.you, SITE_URL.ip.id, MESSAGE.curlInclude.id),
  ],
  takeaway: `Una {{http-header|cabecera HTTP}} es una línea «nombre: valor» de una petición o de una respuesta. La {{host-header|cabecera Host}} de la petición lleva el nombre de la {{url|URL}} tal como se escribió: la petición a ${HOSTNAME.blog} llevó ${HOSTNAME.blog}, aunque sea un alias de ${HOSTNAME.www}, y la petición a la IP llevó ${IP.freshServer}. Un {{web-server|servidor web}} con varios sitios usa esa cabecera para elegir uno: cada sitio es un {{virtual-host|host virtual}}, y todos comparten la IP y el {{port|puerto}}. Cada servidor decide qué hace con un nombre que no tiene sitio: ${NAME.freshServer} da su sitio por defecto, la tienda. Por eso blog mostraba la tienda hasta que agregaste su sitio, y la IP sola, que no es el nombre de ningún sitio, recibe el sitio por defecto. En HTTP/1.1 la cabecera Host es obligatoria.`,
});
