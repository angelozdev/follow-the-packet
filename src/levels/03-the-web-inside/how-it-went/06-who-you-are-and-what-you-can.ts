import { defineIncident } from '@/levels/contract/incident';
import { ADMIN_BODY, ADMIN_URL, APP_HAS_USERS, LAN_PIECES, MESSAGE, NAME, ORIGIN, TASK, bodyTask, sendMoveFrom, statusTask } from '@/levels/03-the-web-inside/shared';

const STATUS_401 = 401;
const STATUS_403 = 403;
const STATUS_200 = 200;

export default defineIncident({
  id: '03-06',
  chapter: 3,
  order: 6,
  title: 'Quién eres y qué puedes',
  role: 'defender',
  mechanic: 'send',
  introduces: ['authentication', 'authorization', 'authorization-header', 'status-401', 'status-403', 'cookie'],
  changes: [APP_HAS_USERS],
  shown: LAN_PIECES,
  report: `Lucía agregó /admin a la app de ${NAME.lucia}: una página solo para quien tenga permiso de administración, y /login, la página donde se inicia sesión. La app conoce a dos usuarios: Lucía, que administra, y Marta, que no. Primero la app debe saber quién pide, la {{authentication}}; después decide qué puede hacer, la {{authorization}}. Con {{curl}} -i, pide /admin desde ${NAME.you} sin credencial, con la de Marta y con la de Lucía, y lee en la caja si la petición mandó la {{authorization-header}} y qué código volvió. Después, en el {{browser}} de ${NAME.you}, inicia sesión como Lucía: la app contesta con una {{cookie}}, el navegador la guarda y la manda en sus peticiones siguientes a ese sitio. {{curl}} no guarda nada: solo manda una {{cookie}} si se la das con -b.`,
  tasks: [
    statusTask(TASK.adminWithoutCredentialIs401, 'Con {{curl}} -i, que /admin sin credencial reciba el código {{status-401}}.', ADMIN_URL.id, STATUS_401),
    statusTask(TASK.adminAsMartaIs403, 'Con la credencial de Marta, que /admin reciba el código {{status-403}}.', ADMIN_URL.id, STATUS_403, MESSAGE.curlMarta.id),
    statusTask(TASK.adminAsLuciaIs200, 'Con la credencial de Lucía, que /admin reciba el código {{status-200}}.', ADMIN_URL.id, STATUS_200, MESSAGE.curlLucia.id),
    bodyTask(TASK.browserEntersAdmin, 'Con el {{browser}}, tras iniciar sesión como Lucía, que /admin reciba la página de administración.', ADMIN_URL.id, ADMIN_BODY, { origin: ORIGIN.you, messageId: MESSAGE.browser.id }),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADMIN_URL], message: [MESSAGE.curlInclude, MESSAGE.curlMarta, MESSAGE.curlLucia, MESSAGE.curlCookie, MESSAGE.browser, MESSAGE.browserLucia, MESSAGE.browserMarta] },
  hints: ['{{status-401}}: la app no sabe quién eres. {{status-403}}: lo sabe y no te deja.', 'Mira qué cabecera mandó cada {{curl}} y qué código volvió.'],
  question: 'Marta recibió un {{status-403|403}}. ¿Le sirve repetir la petición con la misma credencial?',
  explanation: [
    {
      text: 'No: la app ya sabe quién es Marta y no le da permiso.',
      feedback: `El {{status-403}} dice que la app entendió la petición y se niega. La {{authentication}} salió bien: la app sabe que pide Marta. Lo que falta es la {{authorization}}: Marta no tiene permiso de administración, y repetir la misma petición con la misma credencial da el mismo 403. Lo que cambiaría el resultado es otro permiso u otro usuario, como Lucía, que sí lo tiene.`,
      correct: true,
    },
    {
      text: 'Sí: un 403 es temporal y se quita al repetir la petición.',
      feedback: `Un {{status-403}} no avisa que sea temporal. ${NAME.lucia} ya sabe quién es Marta, y su {{authorization}} no cambia porque la petición se repita: la misma petición con la misma credencial da el mismo 403.`,
      correct: false,
    },
    {
      text: 'Sí: un 403 dice que la contraseña de Marta está mal.',
      feedback: 'Una contraseña mal escrita da {{status-401|401}}, no {{status-403|403}}: la app no puede decir quién eres. Con el 403 la contraseña de Marta fue la correcta, y por eso la app sabe quién es y qué permisos tiene.',
      correct: false,
    },
  ],
  solution: [
    sendMoveFrom(ORIGIN.you, ADMIN_URL.id, MESSAGE.curlInclude.id),
    sendMoveFrom(ORIGIN.you, ADMIN_URL.id, MESSAGE.curlMarta.id),
    sendMoveFrom(ORIGIN.you, ADMIN_URL.id, MESSAGE.curlLucia.id),
    sendMoveFrom(ORIGIN.you, ADMIN_URL.id, MESSAGE.browserLucia.id),
    sendMoveFrom(ORIGIN.you, ADMIN_URL.id, MESSAGE.browser.id),
  ],
  takeaway: `La {{authentication}} comprueba quién hace la petición; la {{authorization}} decide qué puede hacer. La petición manda su credencial en la {{authorization-header}}; pese al nombre, esa cabecera sirve para autenticar, no para autorizar. {{status-401}} también habla de autenticación: la app no sabe quién eres, y su respuesta trae WWW-Authenticate, que pide una credencial. {{status-403}}: la app sabe quién eres y no te deja entrar. Por eso Marta recibió 403, repetir la misma petición con la misma credencial da el mismo 403, y Lucía, que tiene permiso de administración, recibió {{status-200}}. Esa diferencia tiene una causa: Lucía agregó /admin a la app de ${NAME.lucia}, con sus usuarios y sus permisos. Un 404 puede esconder un 403: una app puede contestar 404 para no decir que una página existe. En AWS el número solo no basta: hay que ver quién lo generó, y la caja lo dice en «Quién lo generó»; aquí, la app de ${NAME.lucia}. Cada petición se entiende sola: lo que une varias es la {{cookie}}. Al iniciar sesión, la app de ${NAME.lucia} abre una sesión y contesta con una {{cookie}} (la cabecera Set-Cookie); el navegador la guarda y la manda en cada petición a ese sitio, y por eso entra a /admin. {{curl}} no guarda nada: sin -b su petición no trae la {{cookie}} y recibe {{status-401}}. Con -b sesion=s1 manda la {{cookie}} de la primera sesión abierta: quien la manda entra como el usuario de esa sesión, así que da 200 si Lucía inició sesión primero y 403 si fue Marta. Y un cuidado: la credencial viaja por HTTP, y el texto de la cabecera parece un código secreto, pero cualquiera que vea el camino puede volver a leer el usuario y la contraseña.`,
});
