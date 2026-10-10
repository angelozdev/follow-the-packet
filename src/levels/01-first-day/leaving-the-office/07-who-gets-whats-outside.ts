import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, GATEWAY, IP, LESSON, MESSAGE, NAME, OFFICE_PIECES, ORIGIN, TASK, pingTask } from '@/levels/01-first-day/shared';

const NO_VALUE = 'Ninguna';
const GATEWAY_TRAY = '{{default-gateway|puerta de enlace predeterminada}}';

export default defineIncident({
  id: '01-07',
  chapter: 1,
  order: 7,
  title: 'A quién mandas lo de afuera',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['default-gateway'],
  changes: [{ type: 'setGateway', deviceId: DEVICE.you.id }],
  shown: OFFICE_PIECES,
  report: `Reinstalaron ${NAME.you}. Perdió un ajuste guardado: la {{default-gateway|puerta de enlace predeterminada}}. Es la {{ip-address|IP}} a la que ${NAME.you} manda los {{packet|paquetes}} que van a otra {{lan|red local}}. Debe ser la de un {{router}}. Haz un {{ping}} a ${NAME.andres} y mira qué pasa. Después abre «Ajustes de red» en ${NAME.you} y arregla ese ajuste.`,
  tasks: [pingTask(TASK.andres, `Que tu {{ping}} a ${NAME.andres} vuelva.`, ADDRESS.andres.id, 'replied', DEVICE.andres.id)],
  flows: [],
  send: {
    from: [ORIGIN.you],
    to: [ADDRESS.andres, ADDRESS.printer],
    message: [MESSAGE.ping],
    settings: [
      {
        id: GATEWAY.setting,
        deviceId: DEVICE.you.id,
        name: GATEWAY_TRAY,
        chips: [
          { id: GATEWAY.none, label: NO_VALUE, value: null },
          { id: GATEWAY.router, label: IP.router, value: IP.router },
          { id: GATEWAY.printer, label: IP.printer, value: IP.printer },
          { id: GATEWAY.nobody, label: IP.nobody, value: IP.nobody },
        ],
      },
    ],
  },
  hints: [
    `La {{default-gateway|puerta de enlace predeterminada}} de ${NAME.you} debe ser la {{ip-address|IP}} que ${NAME.router} tiene en tu piso: mírala en su caja. Elígela en «Ajustes de red».`,
    `Elige ${IP.router}, la IP que ${NAME.router} tiene en tu piso, y vuelve a enviar el {{ping}}.`,
  ],
  question: `¿Por qué tu {{ping}} a ${NAME.andres} no salió de ${NAME.you}?`,
  explanation: [
    {
      text: `Porque ${NAME.you} no tenía {{default-gateway|puerta de enlace predeterminada}}: no sabía a quién entregar los {{packet|paquetes}} que van a otra {{lan|red local}}.`,
      feedback: 'Eso es. Lo de tu red local se entrega directo. Lo que va a otra red local se entrega a la {{default-gateway|puerta de enlace predeterminada}}, que debe ser la {{ip-address|IP}} de un {{router}}. Sin ese ajuste, el {{packet|paquete}} ni sale.',
      correct: true,
    },
    {
      text: 'Porque el {{router}} de tu piso no estaba funcionando.',
      feedback: `No. El {{packet|paquete}} ni salió de ${NAME.you}: nunca llegó al router, así que el router ni pudo recibirlo. Lo que faltaba era un ajuste de ${NAME.you}.`,
      correct: false,
    },
    {
      text: `Porque ${NAME.andres} no tiene {{ip-address|IP}}.`,
      feedback: `No. ${NAME.andres} sí tiene IP, ${IP.andres}, y se ve en su caja. El {{ping}} no salió porque ${NAME.you} no sabía a quién entregarlo.`,
      correct: false,
    },
  ],
  solution: [
    { type: 'setSetting', deviceId: DEVICE.you.id, settingId: GATEWAY.setting, chipId: GATEWAY.router },
    { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.andres.id, messageId: MESSAGE.ping.id },
  ],
  takeaway: 'La {{default-gateway|puerta de enlace predeterminada}} es un ajuste guardado en un {{device|dispositivo}}: la {{ip-address|IP}} a la que manda los {{packet|paquetes}} que van a otra {{lan|red local}}. Debe ser la de un {{router}}. Sin ella, el {{packet|paquete}} no sale.',
});
