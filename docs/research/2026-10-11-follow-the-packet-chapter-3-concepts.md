# Capítulo 3, «La web por dentro»: qué conceptos enseñar

Fecha: 2026-10-11 · Estado: investigación. No cambia el juego ni el código. No propone subcapítulos, incidentes, mecánicas ni plan: el estudiante pidió solo los conceptos.

Parte de la [ficha del capítulo 3](2026-10-09-follow-the-packet-chapters.md) (líneas 79 a 85) y de sus tres preguntas. Lee también las fichas de los capítulos que lo usan después (4, 5, 7, 9, 13 y 20, más 8, 14, 16, 18, 19 y 23 de pasada), el [spec del capítulo 2](../specs/2026-10-11-follow-the-packet-chapter-2-design.md) y el registro de términos del código (`projects/follow-the-packet/src/copy/terms.ts`, en el worktree del capítulo 2, solo lectura). El formato imita la [investigación del capítulo 2](2026-10-10-follow-the-packet-chapter-2-concepts.md).

## Cómo leer este informe

- Frases cortas. Una idea por frase.
- Cada dato lleva una etiqueta de evidencia:
  - **[fuente]**: lo leí en la fuente citada el 2026-10-11.
  - **[local]**: lo probé desde el Mac del estudiante (macOS 26.6.2, `curl` 8.7.1 con LibreSSL, OpenSSL 4.0.3, Node v24.14.0) el 2026-10-11. Solo prueba esa máquina y ese día. Solo hice clientes contra sitios públicos. No arranqué ningún servidor.
  - **[inferencia]**: lo deduzco de lo que leí. No lo leí escrito.
  - **[sin verificar]**: no pude confirmarlo. Se dice sin adornos.
- Las citas entre comillas están en inglés porque las fuentes lo están. Las comprobé contra una copia local del RFC o de la página.
- Los números de sección vienen del RFC.
- Las páginas de AWS las leí convertidas a texto. Algunas tablas pueden haber perdido formato.

---

## Resumen

- **65 términos: 55 Núcleo y 10 Apoyo,** en siete grupos (A a G). Cada definición mide 120 caracteres o menos. Un script comprobó que la escalera se cumple en orden lineal estricto (sección 1.1).
- **Lo que la ficha no nombra y los capítulos posteriores sí piden:**
  - Para el 7, el 9 y el 13: proxy inverso y servidor de origen (sin ellos 502, 503 y 504 no se explican), cabecera Host y host virtual, SNI, terminación de TLS, conexión persistente e idle timeout.
  - Para el 5, el 8 y el 20: autenticación, autorización, hash y firma digital, y la cabecera Authorization.
  - Para el 5, el 13 y el 14: API e idempotente.
- **Lo que la ficha nombra y queda como está:** petición, respuesta, método, URL, cabeceras, códigos de estado, proceso que escucha, TLS, certificado, cifrado simétrico y asimétrico, REST y JSON.
- **Correcciones de rigor más importantes** (sección 4):
  1. 401 habla de autenticación y 403 de permiso, pero AWS no respeta esa raya: API Gateway da 403 a un token que falta.
  2. 502 y 504 son, por definición, códigos de un intermediario (proxy inverso), no de la app. El 503 puede venir de cualquiera de los dos: del servidor sobrecargado o de un proxy que no tiene a quién reenviar. Un ALB reenvía tal cual los errores válidos de sus targets, y en un ALB «todas las instancias están unhealthy» no da 503: el ALB **falla abierto**.
  3. HTTPS es HTTP dentro de TLS, no otro protocolo. El número 443 es una costumbre.
  4. TLS 1.3 cifra el certificado. No cifra el SNI (salvo con ECH), ni la IP, ni el puerto, ni la consulta DNS.
  5. El certificado es público. Lo secreto es la clave privada, y en TLS 1.3 esa clave **firma**, no descifra nada.
  6. Un cliente valida el nombre contra el SAN, nunca contra el CN. Una cadena incompleta pasó en el `curl` de macOS y falló en Node y en OpenSSL. En un navegador no lo probé.
  7. Una redirección 301 puede volver GET a un POST. Un ALB solo sabe hacer 301 y 302.
  8. REST no es «JSON por HTTP».
- **HTTP/3 cabe,** como un solo término de Apoyo y una frase. La mecánica de QUIC queda fuera.
- **Fuera del capítulo:** CORS, caché HTTP, tokens y JWT, la firma de AWS (SigV4), cifrado de sobre, ACM en detalle, OSI y capas 4 y 7. Cada uno con su capítulo en la sección 5.
- **Sin verificar:** el calendario exacto de la vida de los certificados, si ALB y API Gateway hablan HTTP/3, y qué hace API Gateway cuando una Lambda lanza una excepción. Lista completa en la sección 7.2.

---

## 1. Lista final de términos

### 1.1 Cómo se armó

**Criterio de clase.**

- **Núcleo:** sin ese término no se entiende un capítulo posterior. La columna «Capítulos que lo necesitan» dice cuál, y la sección 3 enseña con qué palabras de la ficha de ese capítulo (o de la documentación de AWS que esa ficha obliga a leer) se llega a él.
- **Apoyo:** ayuda, pero cabe en la explicación de otro término. Se puede quitar sin que ningún capítulo posterior se rompa. En sus filas, «Capítulos que lo necesitan» quiere decir «capítulos que lo usan»: lo usan, pero no se bloquean sin él.

**Orden y escalera.** El orden de la tabla es lineal. Cada definición usa solo términos de los capítulos 1 y 2 o términos anteriores de esta misma lista. Cuando dos términos se necesitan entre sí (petición y respuesta; certificado y autoridad certificadora), el primero usa palabras corrientes para las partes del otro (por ejemplo «cabeceras» sin etiqueta) y el segundo ya puede nombrar al primero.

**Cómo comprobé el orden.** Escribí un script que repite la lógica de `namedTerms` de `src/levels/ladder.ts`: el nombre del término entero, sin distinguir mayúsculas, solo o con plural `s` o `es` al final.

1. **Registro.** Copié `terms.ts` del worktree del capítulo 2 y lo cargué con Node (106 términos: 38 del capítulo 1, 53 del 2 incluidos `cidr`, `dns` y `nat`, y 15 que son solo del 4).
2. **Calibración.** Antes de confiar en el script lo corrí sobre la tabla de 53 definiciones del spec del capítulo 2, con los términos conocidos de cada incidente. Resultado: 0 choques y 0 problemas de largo, igual que dice el spec.
3. **Comprobaciones sobre esta lista:**
   - Cada definición mide 120 caracteres o menos (contados como `.length`, no en bytes).
   - Los ids son kebab-case, únicos, no están en el registro y no son ids retirados (`server`, `request`, `response`, `linux-ignore-ping`). Por eso son `http-request` y `http-response`.
   - Los nombres son únicos y no repiten uno del registro.
   - **Escalera hacia adelante:** ninguna definición nombra un término posterior de la lista ni uno solo del capítulo 4 (`Security Group`, `VPC`, `instancia EC2`, `stateful`, `regla de entrada`…).
   - **Escalera hacia atrás:** ninguna definición de los capítulos 1 y 2 nombra un término nuevo. Esa prueba es la que impide registrar el nombre `Host` solo: la definición de `dispositivo` dice «También se le llama host».
4. **Resultado:** 65 términos, 0 problemas, la definición más larga mide 120.
5. **El primer borrador falló 25 veces.** Veintitrés definiciones pasaban de 120 caracteres. Dos rompían la escalera: la definición de `url` ponía el ejemplo `https://…` y nombraba a `HTTPS`, y la de `respuesta HTTP` nombraba a `código de estado`. Las corregí.

El script no queda en el repo. Vive en el directorio temporal de la sesión.

### 1.2 La tabla

Grupos:

- **A.** Servidor web, URL y mensajes HTTP.
- **B.** Códigos de estado y quién los genera (incluye autenticación, proxy inverso y servidor de origen).
- **C.** Conexiones, la IP del cliente y las cookies.
- **D.** Cifrado.
- **E.** TLS y certificados.
- **F.** Herramientas de consola.
- **G.** APIs, JSON, REST y versiones de HTTP.

| N.º | Grupo | Id | Término | Definición (máx. 120 caracteres) | Largo | Clase | Capítulos que lo necesitan |
|-----|-------|----|---------|----------------------------------|-------|-------|----------------------------|
| 1 | A | `process` | proceso | Un programa mientras corre en un dispositivo. Un servicio escucha desde un proceso; si este termina, deja de escuchar. | 118 | Núcleo | 7, 11 |
| 2 | A | `http` | HTTP | HyperText Transfer Protocol: el protocolo con que un cliente pide un recurso (página, dato) y el servidor responde. | 115 | Núcleo | 5, 7, 13 |
| 3 | A | `url` | URL | Uniform Resource Locator: la dirección de un recurso web. Por ejemplo: http://lucia.example:8080/pedidos?id=7 | 109 | Núcleo | 9, 13 |
| 4 | A | `url-path` | path | La parte de la URL que va después del nombre y del puerto, como /pedidos. Dice qué recurso del servidor se pide. | 112 | Núcleo | 7, 13, 20 |
| 5 | A | `query-string` | query string | Lo que va en la URL después de ?, como id=7: pares nombre=valor que precisan lo que se pide. | 92 | Apoyo | 9, 20 |
| 6 | A | `http-request` | petición HTTP | El mensaje con que un cliente pide algo: método, path con su query string, cabeceras y, a veces, un cuerpo de datos. | 116 | Núcleo | 7, 13, 20 |
| 7 | A | `http-response` | respuesta HTTP | El mensaje con que el servidor contesta: un código numérico, cabeceras y, a veces, un cuerpo de datos. | 102 | Núcleo | 7, 13 |
| 8 | A | `http-method` | método HTTP | Lo que la petición quiere hacer: GET lee un recurso, POST le manda datos, PUT lo reemplaza y DELETE lo borra. | 109 | Núcleo | 9, 13, 20 |
| 9 | A | `idempotent` | idempotente | Una operación es idempotente si repetirla deja el mismo efecto que hacerla una vez. GET, PUT y DELETE lo son; POST, no. | 119 | Núcleo | 5, 14 |
| 10 | A | `http-header` | cabecera HTTP | Una línea «nombre: valor» de una petición o respuesta, como Content-Type. No es el encabezado del paquete. | 106 | Núcleo | 5, 9, 13, 20 |
| 11 | A | `web-server` | servidor web | Un servicio que contesta peticiones HTTP. Por defecto escucha en el puerto 80, aunque puede usar cualquier otro. | 112 | Núcleo | 7, 11 |
| 12 | A | `browser` | navegador | Un programa que hace peticiones HTTP a nombre de una persona y muestra las respuestas. Es un cliente. | 101 | Núcleo | 9, 20 |
| 13 | A | `host-header` | cabecera Host | La cabecera HTTP con el nombre y el puerto de la petición. Un servidor con varios sitios la usa para elegir uno. | 112 | Núcleo | 7, 9 |
| 14 | A | `virtual-host` | host virtual | Un sitio entre varios que comparten un servidor web y una IP. La cabecera Host dice cuál se pide. | 97 | Núcleo | 7, 9 |
| 15 | B | `status-code` | código de estado | El código de tres cifras con que una respuesta HTTP dice cómo salió la petición. La primera cifra da la clase. | 110 | Núcleo | 7, 13, 16 |
| 16 | B | `status-200` | 200 OK | La petición se cumplió. Con un GET, el cuerpo de la respuesta trae el recurso pedido. | 85 | Núcleo | 7, 13 |
| 17 | B | `redirect` | redirección | Una respuesta que manda a otra URL (301, 302, 307, 308). Con 301 y 302 un POST puede volverse GET; con 307 y 308, no. | 117 | Núcleo | 7, 9, 20 |
| 18 | B | `status-301` | 301 Moved Permanently | El recurso tiene otra URL, permanente, en la cabecera Location. Una caché puede recordarla. | 91 | Núcleo | 7, 9 |
| 19 | B | `client-error` | error 4xx | Un código 4xx: la petición, tal como llegó, no se puede cumplir. Parece un error del cliente, pero no siempre lo es. | 116 | Núcleo | 7, 13, 16, 19 |
| 20 | B | `status-400` | 400 Bad Request | El servidor rechaza la petición porque está mal formada o trae datos que no acepta. | 83 | Apoyo | 13 |
| 21 | B | `authentication` | autenticación | Comprobar quién hace una petición, por ejemplo con una contraseña o una clave. | 78 | Núcleo | 5, 8, 20 |
| 22 | B | `authorization` | autorización | Decidir qué puede hacer quien ya se identificó, según sus permisos. Va después de la autenticación. | 99 | Núcleo | 5, 8, 20 |
| 23 | B | `authorization-header` | cabecera Authorization | La cabecera HTTP con que el cliente manda cómo se identifica. Pese al nombre, sirve para autenticar, no para autorizar. | 119 | Núcleo | 5, 13, 20 |
| 24 | B | `status-401` | 401 Unauthorized | Falta una autenticación válida: el servidor no sabe quién eres. Pese al nombre, habla de autenticación. | 103 | Núcleo | 13, 20 |
| 25 | B | `status-403` | 403 Forbidden | El servidor entendió la petición y se niega: no hay permiso o una restricción lo impide. Repetirla igual no cambia nada. | 120 | Núcleo | 7, 9, 13, 20 |
| 26 | B | `status-404` | 404 Not Found | No hay un recurso en esa URL, o el servidor no quiere decir si existe. | 70 | Núcleo | 9 |
| 27 | B | `status-429` | 429 Too Many Requests | El cliente mandó demasiadas peticiones en poco tiempo. Quien limita puede añadir Retry-After: cuándo reintentar. | 112 | Núcleo | 5, 13, 20 |
| 28 | B | `server-error` | error 5xx | Un código 5xx: el servidor sabe que falló o no puede cumplir una petición que parece válida. | 92 | Núcleo | 7, 13, 16, 19 |
| 29 | B | `status-500` | 500 Internal Server Error | El servidor tuvo un fallo inesperado al atender la petición y no dice más. | 74 | Apoyo | 13, 16 |
| 30 | B | `reverse-proxy` | proxy inverso | Un servidor que recibe peticiones HTTP en nombre de otro y las reenvía por otra conexión. El cliente solo ve al proxy. | 118 | Núcleo | 7, 9, 13, 20 |
| 31 | B | `origin-server` | servidor de origen | El servidor que genera la respuesta definitiva de un recurso, detrás de los proxies inversos que haya en medio. | 111 | Núcleo | 7, 9 |
| 32 | B | `status-502` | 502 Bad Gateway | Un proxy inverso no obtuvo respuesta válida del servidor de origen: conexión rechazada o cortada, o respuesta ilegible. | 119 | Núcleo | 7, 9, 13 |
| 33 | B | `status-503` | 503 Service Unavailable | El servidor no puede atender ahora, por sobrecarga o mantenimiento. Un proxy inverso lo da si no tiene a quién reenviar. | 120 | Núcleo | 7, 9 |
| 34 | B | `status-504` | 504 Gateway Timeout | Un proxy inverso no recibió respuesta del servidor de origen a tiempo. Quizá la petición ni llegó. | 98 | Núcleo | 7, 9, 13 |
| 35 | C | `x-forwarded-for` | X-Forwarded-For | Cabecera HTTP con la IP del cliente que añade un proxy inverso. Sin ella, el servidor de origen solo ve la IP del proxy. | 120 | Apoyo | 7, 20 |
| 36 | C | `persistent-connection` | conexión persistente | Una conexión TCP que se reutiliza para varias peticiones HTTP seguidas, en vez de abrir una por petición. | 105 | Núcleo | 7, 13 |
| 37 | C | `idle-timeout` | idle timeout | El tiempo que una conexión puede estar sin datos antes de que un extremo la cierre. Cada extremo tiene el suyo. | 111 | Núcleo | 7, 13 |
| 38 | C | `cookie` | cookie | Un dato que el servidor manda con Set-Cookie y que el navegador devuelve en las peticiones siguientes a ese sitio. | 114 | Apoyo | 7, 9, 20 |
| 39 | D | `encryption` | cifrado | Convertir datos en un texto ilegible con una clave. Solo quien tiene la clave adecuada puede volver a leerlos. | 110 | Núcleo | 8, 9, 10 |
| 40 | D | `symmetric-encryption` | cifrado simétrico | Cifrado con una sola clave, la misma para cifrar y descifrar. Es rápido, pero ambas partes deben compartirla en secreto. | 120 | Núcleo | 7, 8 |
| 41 | D | `asymmetric-encryption` | cifrado asimétrico | Cifrado con un par de claves: una pública, que se reparte, y una privada, que su dueño no comparte. Cifra y firma. | 114 | Núcleo | 7, 8, 20 |
| 42 | D | `public-key` | clave pública | La mitad del par que se reparte a todos. Cifra datos para su dueño y comprueba sus firmas. | 90 | Núcleo | 7, 20 |
| 43 | D | `private-key` | clave privada | La mitad del par que su dueño no comparte nunca. Descifra lo que cifró la pública y crea las firmas. | 100 | Núcleo | 7, 8, 20 |
| 44 | D | `hash` | hash | Un resumen de tamaño fijo de unos datos. Si los datos cambian, el hash cambia; del hash no se recuperan los datos. | 114 | Núcleo | 5, 11 |
| 45 | D | `digital-signature` | firma digital | Prueba creada con una clave privada sobre unos datos. Con la clave pública se comprueba quién firmó y que nada cambió. | 118 | Núcleo | 8, 20 |
| 46 | E | `tls` | TLS | Transport Layer Security: protocolo que comprueba quién es el servidor y cifra los datos en tránsito. Sucede a SSL. | 115 | Núcleo | 5, 7, 9 |
| 47 | E | `certificate` | certificado | Un documento firmado por una entidad de confianza que une nombres con una clave pública. No incluye la clave privada. | 117 | Núcleo | 7, 9 |
| 48 | E | `certificate-authority` | autoridad certificadora | Autoridad certificadora (CA): la entidad que firma certificados tras comprobar que quien los pide controla el nombre. | 117 | Núcleo | 7, 9 |
| 49 | E | `san` | SAN | Subject Alternative Name: la lista de nombres que cubre un certificado. El cliente busca ahí el nombre que pidió. | 113 | Núcleo | 7, 9 |
| 50 | E | `wildcard-certificate` | certificado comodín | Certificado de *.lucia.example: cubre un nivel (www.lucia.example), pero no lucia.example ni a.b.lucia.example. | 111 | Núcleo | 7, 9 |
| 51 | E | `certificate-chain` | cadena de certificados | Los certificados encadenados: el del servidor, el de la CA que lo firmó y así hasta una raíz que el cliente ya trae. | 116 | Núcleo | 7, 9 |
| 52 | E | `self-signed-certificate` | certificado autofirmado | Un certificado firmado con su propia clave privada, sin CA. Solo vale para quien decida confiar en él. | 102 | Apoyo | 7, 9 |
| 53 | E | `certificate-validation` | validación del certificado | Lo que comprueba el cliente: el nombre en el SAN, la cadena hasta una raíz de confianza y que hoy esté en sus fechas. | 117 | Núcleo | 7, 9 |
| 54 | E | `tls-handshake` | saludo TLS | Los mensajes que abren una conexión TLS: el servidor muestra su certificado y ambos acuerdan versión y claves. | 110 | Núcleo | 7, 9 |
| 55 | E | `session-key` | clave de sesión | La clave simétrica que ambos calculan en el saludo TLS. Cifra los datos de esa conexión y nunca viaja por la red. | 113 | Apoyo | 8 |
| 56 | E | `sni` | SNI | Server Name Indication: el nombre que el cliente manda, casi siempre sin cifrar, en el saludo TLS. Elige el certificado. | 120 | Núcleo | 7, 9 |
| 57 | E | `https` | HTTPS | HTTP dentro de una conexión TLS: los mismos mensajes, cifrados. Su puerto por defecto es el 443. | 96 | Núcleo | 5, 7, 9, 13 |
| 58 | E | `tls-termination` | terminación de TLS | El punto donde acaba la conexión TLS del cliente y se descifra la petición. Desde ahí puede seguir por otra conexión. | 117 | Núcleo | 7, 9, 13 |
| 59 | E | `hsts` | HSTS | HTTP Strict Transport Security: cabecera que ordena al navegador usar solo HTTPS con ese nombre durante un tiempo. | 114 | Apoyo | 9, 20 |
| 60 | F | `curl` | curl | Herramienta de consola que hace una petición HTTP y muestra la respuesta. Con -v, también el saludo TLS y las cabeceras. | 120 | Núcleo | 5, 7, 9, 13 |
| 61 | F | `openssl-s-client` | openssl s_client | Una herramienta de consola que abre una conexión TLS a un nombre y un puerto y muestra el certificado y la cadena. | 114 | Apoyo | 7, 9 |
| 62 | G | `api` | API | Application Programming Interface: las operaciones que un programa ofrece a otros programas y la forma de pedirlas. | 115 | Núcleo | 5, 13, 23 |
| 63 | G | `json` | JSON | JavaScript Object Notation: texto para datos, con objetos { }, listas [ ], textos, números, true, false y null. | 111 | Núcleo | 5, 8, 13, 18 |
| 64 | G | `rest` | REST | Representational State Transfer: estilo de API web con recursos en URL, métodos HTTP y enlaces. No exige JSON. | 110 | Núcleo | 13 |
| 65 | G | `http-versions` | versiones de HTTP | HTTP/1.1 y HTTP/2 van sobre TCP; HTTP/3, sobre UDP. Los métodos, las URL y los códigos de estado son los mismos. | 112 | Apoyo | 7, 9 |

### 1.3 Notas de la tabla

**Cuántos por grupo.**

| Grupo | Términos | Núcleo | Apoyo |
|-------|----------|--------|-------|
| A | 14 | 13 | 1 |
| B | 20 | 18 | 2 |
| C | 4 | 2 | 2 |
| D | 7 | 7 | 0 |
| E | 14 | 11 | 3 |
| F | 2 | 1 | 1 |
| G | 4 | 3 | 1 |
| **Total** | **65** | **55** | **10** |

Los Apoyo son: `query-string`, `status-400`, `status-500`, `x-forwarded-for`, `cookie`, `self-signed-certificate`, `session-key`, `hsts`, `openssl-s-client` y `http-versions`.

**Cómo se parte la lista, sin proponer capítulos.** Los grupos A a C (38 términos) hablan de HTTP y de quién genera cada código. Los grupos D a F (23 términos) hablan de cifrado, TLS y certificados. El grupo G (4) es el vocabulario de APIs. No hay término que cruce la línea sin nombrarse primero. El ritmo del capítulo 2 fue de 53 términos en 14 subcapítulos; este tiene 65. Decide el dueño del plan.

**Palabras de las definiciones que no son términos.** Aparecen como palabras corrientes o como ejemplo. Si el estudiante quiere definirlas, ya hay dónde.

| Palabra | Dónde aparece | Qué hacer |
|---------|---------------|-----------|
| recurso | `http`, `url`, `url-path`, `rest` | Se define con el ejemplo de la URL. Es la palabra de RFC 9110 §3.1 |
| caché | `status-301` | El capítulo 2 tiene `caché DNS`; la caché HTTP va al 9 |
| raíz | `certificate-chain`, `certificate-validation` | Se define dentro de la cadena |
| extremo | `idle-timeout` | Palabra corriente |
| SSL | `tls` | Nombre del antecesor. Sección 4.3 |
| CA | `certificate-chain`, `self-signed-certificate` | La abrevia la propia definición de la autoridad certificadora |
| Location, Retry-After, Set-Cookie, Content-Type | `status-301`, `status-429`, `cookie`, `http-header` | Nombres de cabeceras puestos como ejemplo. No se registran |
| GET, POST, PUT, DELETE | `http-method` | Los define el método. HEAD, OPTIONS y PATCH esperan al capítulo que los use |
| 3xx | `redirect` | Notación. Lo que hay detrás es la clase de códigos 3 |

**Nombres que evité porque romperían la escalera o confundirían:**

- «Host» solo: lo nombra la definición de `dispositivo` («También se le llama host»). Por eso es «cabecera Host» y «host virtual».
- «encabezado»: ya es la parte del paquete (capítulo 1). Para HTTP es «cabecera HTTP» y la definición lo dice.
- «ruta»: ya es la instrucción de reenvío (capítulo 2). La parte de la URL se llama «path». Más choques de nombres en la sección 4.15.
- «clave» suelta, «token» y «gateway»: cada una significa otra cosa en otro capítulo (4.15).
- Los ids `request`, `response` y `server`: el test del registro los rechaza.

**Un aviso para quien implemente** (no es parte de esta investigación): `terms.test.ts` exige que solo `ip-address` y `security-group` tengan forma corta. Ninguno de los 65 la necesita: las siglas (`CA`, `SAN`, `SNI`) se expanden dentro de la definición, como `RTT` y `TTL` en el capítulo 1.

---

## 2. Lo que ya existe y no se repite

Estos términos de los capítulos 1 y 2 los usa el capítulo 3 **sin redefinirlos**. La columna dice cómo.

| Término (capítulo) | Cómo lo usa el 3 |
|--------------------|------------------|
| dispositivo, host (1) | El servidor web y el navegador corren en dispositivos. «Host» en una URL es un nombre, no un dispositivo (4.15) |
| red, IP, IPv4, IP de origen y de destino (1) | Qué ve quien mira la red bajo TLS (4.4). Qué IP ve el servidor de origen detrás de un proxy inverso |
| paquete (1) | Un mensaje HTTP **no es** un paquete: viaja en los datos de una conexión TCP, partido en los paquetes que haga falta. TCP no conserva los límites de los mensajes (investigación del capítulo 2, 4.1) |
| encabezado (1) | Lleva IP y puertos. La cabecera HTTP es otra cosa y la definición lo dice |
| protocolo (1) | HTTP y TLS son protocolos. La definición de `http` y la de `tls` lo usan |
| ICMP, ping, traceroute (1) | El ping prueba el equipo, no la web. Un 200 prueba lo que un ping no puede |
| loopback, localhost (1) | `localhost` y `127.0.0.1` en una URL. Un certificado para `localhost` no lo emite una autoridad pública [inferencia] |
| timeout (1) | Lo que ve el cliente cuando nadie contesta, antes de que exista cualquier código HTTP. No es el 504 |
| red local, puerta de enlace predeterminada, router (1) | «Gateway» en 502 Bad Gateway **no** es la puerta de enlace predeterminada. Es un proxy inverso (4.15) |
| IP privada, IP pública, NAT (1 y 2) | Por qué el servidor de origen ve la IP del proxy o la del NAT y no la del cliente |
| firewall, regla, permitir, denegar, denegación por defecto, entrada, salida, tráfico, descartar (1) | Abrir el 80 y el 443 es una regla. Si se cierra el 80, la redirección a HTTPS no ocurre: el cliente ve un timeout |
| mínimo privilegio (1) | Cerrar el 80 es lo más estricto. Deja sin redirección a quien escriba `http://`. La tensión es real (4.8) |
| servicio, puerto, escuchar, IP:puerto (2) | Un servidor web es un servicio que escucha. `process` solo añade quién lo ejecuta |
| puerto de destino, de origen, efímero (2) | La respuesta HTTP vuelve al puerto efímero del navegador, como cualquier otra |
| dirección de escucha (2) | Una app Node que escucha solo en `127.0.0.1` rechaza al navegador de otro equipo. No es un error HTTP |
| puerto por defecto, puertos conocidos, rango de puertos (2) | 80 y 443 son costumbre. `https` y `web-server` repiten la costumbre. No definen el protocolo (4.3) |
| cliente y servidor (2) | El navegador es cliente. Un proxy inverso es servidor para el navegador y cliente para el servidor de origen, en el mismo dispositivo |
| TCP, conexión, saludo de tres pasos (2) | HTTP va sobre una conexión TCP. El saludo TLS viene **después** del saludo de tres pasos. Ojo: `conexión` es TCP en el 2. El 3 dice «conexión TLS» sobre esa conexión y no define «conexión QUIC» |
| UDP (2) | Solo para `versiones de HTTP`: HTTP/3 va sobre UDP |
| puerto cerrado, RST, Connection refused, puerto filtrado, nc (2) | El primer nivel de fallo: nadie escucha en el 80 o el 443. Pasa antes de TLS y antes de HTTP |
| DNS, nombre de dominio, consulta DNS, resolver, registro A, TTL de DNS, NXDOMAIN, dig (2) | El nombre se resuelve antes de todo. La consulta DNS viaja en claro (4.4) |
| registro CNAME (2) | ACM valida el dominio con registros CNAME (sección 3, capítulo 7) |
| SSH (2) | Otro protocolo cifrado sobre TCP, con su propia confianza en claves de host. No entra [inferencia] |
| CIDR, prefijo, rutas, NAT, DHCP, archivo hosts (2) | No los usa el 3 |

**El orden de diagnóstico de «no conecta» crece.** El capítulo 2 deja tres preguntas: ¿resuelve el nombre?, ¿hay ruta?, ¿contesta el puerto? El 3 agrega las que siguen, **en este orden de fallo**:

1. ¿Completa el saludo TLS? Los errores de certificado ocurren aquí. Todavía no hay ningún código HTTP.
2. ¿Qué código de estado vuelve? Si hay un código, TCP y TLS ya funcionaron.
3. ¿Quién generó ese código: el servidor de origen o un intermediario?

La tercera pregunta es la ficha: «en qué tramo del camino nació» el error.

**El mundo del capítulo 2 ya tiene los actores.** El spec del capítulo 2 pone a `servidor-internet` a escuchar en el 80 y el 443 «solo como números (la web es del capítulo 3)» y a la app de `laptop-lucia` en el 3000. El 3 les da la web.

---

## 3. Lo que los capítulos posteriores dan por sabido del 3

Cada capítulo cita palabras de su ficha y dice qué términos de la lista las sostienen. Las marcas `*` son Apoyo.

### Capítulo 4, «La noche de guardia»

- **Ficha:** prerrequisitos 1 y 2. Temas: instancia EC2 y VPC, Security Group (entrada, salida, stateful), Internet gateway, nombres DNS de la instancia, Región y zona de disponibilidad, Security Group default.
- **Da por sabido del 3: casi nada.** Los dos incidentes construidos usan solo ICMP y el puerto 22.
- **Una sola cosa:** la consola de AWS rotula los puertos de un servidor web como «80 (HTTP)» y «443 (HTTPS)» en sus reglas de ejemplo **[fuente]** (`security-group-rules-reference`). Esos nombres los da el 3 (`http`, `https`). El número ya lo da el 2.
- **Orden del juego:** el plan hace que el 04-01 se abra con el último incidente del 3. Es orden del juego, no una dependencia de términos.
- **No asume:** nada de HTTP más allá de los nombres de esos dos puertos.

### Capítulo 5, «Tu cuenta de AWS»

- **Ficha:** «API de AWS y endpoint regional», «consola, CLI y SDK», credenciales, «permitido o negado por una política». Pregunta: «¿Cómo se dibuja una llamada a la API (firma, endpoint, AccessDenied)?»
- **Da por sabido:** `api`, `http`, `https`, `tls`, `http-header`, `authorization-header`, `authentication`, `authorization`, `hash`, `status-429`, `idempotent`, `json`, `curl`.
- **Por qué:**
  - Un endpoint de AWS es una URL `https://…` **[fuente]** (`aws-endpoints`: `https://dynamodb.us-west-2.amazonaws.com`).
  - La firma de SigV4 va en la cabecera `Authorization` **[fuente]**. Se calcula con un hash con clave (HMAC-SHA256) **[fuente]**. AWS llama «simétrica» a SigV4 y «asimétrica» a SigV4a **[fuente]** (`reference_sigv`).
  - `AccessDenied` es una autorización. Una credencial que falta es una autenticación.
  - El SDK reintenta. Reintentar es seguro si la operación es idempotente. [inferencia: cuántos reintentos y de qué códigos, es del 5]
- **No asume:** «endpoint» como término de AWS, credenciales, clave de acceso, los pasos de SigV4. Los trae el 5. Hay que mantener separadas **firma digital** (asimétrica, de este capítulo) y **firma de AWS** (hash con clave): son cosas distintas con la misma palabra.

### Capítulo 7, «Muchos servidores, una dirección»

- **Ficha:** «peticiones HTTP que el balanceador reparte entre instancias», «target group y health check», «certificado de ACM en el listener», «app sin estado». Preguntas: «¿Cómo ve el jugador un health check que falla (502, 503, instancia reemplazada)?» y «¿ALB o NLB: qué viaja distinto en cada uno?»
- **Da por sabido (43 términos de la lista).** Los más pesados:
  - `reverse-proxy`, `origin-server`: el ALB es el proxy inverso y los targets son servidores de origen.
  - `status-502`, `status-503`, `status-504`, `server-error`: la sección 4.2 reúne las causas del ALB, tomadas de su página de errores.
  - `persistent-connection`, `idle-timeout`: dos de las causas del 502 y del 504 del ALB.
  - `tls-termination`, `certificate`, `san`, `wildcard-certificate`, `certificate-chain`, `certificate-validation`, `sni`, `tls-handshake`: el listener HTTPS con un certificado de ACM, y el certificado por defecto cuando no llega SNI **[fuente]**.
  - `redirect`, `status-301`: el ALB tiene una acción de redirección **[fuente]**.
  - `host-header`, `url-path`, `virtual-host`: las reglas del listener y el Host que manda el health check **[fuente]**.
  - `process`, `web-server`: lo que escucha en el target.
  - `curl`, `openssl-s-client*`.
- **El HTTP sin estado sostiene el reparto.** RFC 9110 §3.3: cada petición se entiende sola, y «many implementations depend on HTTP's stateless design in order to … dynamically load balance requests across multiple servers» **[fuente]**. «App sin estado» (7) y «stateless» de la network ACL (6) son otras dos cosas (4.13).
- **No asume:** listener, target group, health check, zona de disponibilidad, la política de seguridad de TLS, «capa 4» y «capa 7». AWS usa esas dos: el ALB «functions at the application layer, the seventh layer» y el NLB «at the fourth layer» **[fuente]** (`introduction` de cada uno). Los nombres con número son del 7 (sección 5).

### Capítulo 9, «El bucket y el borde»

- **Ficha:** «un GET de un objeto, del navegador a una ubicación de borde y, si no está en caché, al bucket», «CloudFront, caché e invalidación», «Origin Access Control», «URL prefirmada y CORS». Pregunta: «¿Por qué falla un GET a S3?»
- **Da por sabido:** `http-method`, `url`, `query-string*`, `http-header`, `host-header`, `virtual-host`, `browser`, `reverse-proxy`, `origin-server`, `status-301`, `status-403`, `status-404`, `status-502`, `status-503`, `status-504`, `redirect`, `tls-termination`, `certificate-chain`, `certificate-validation`, `sni`, `hsts*`, `http-versions*`, `cookie*`.
- **Por qué, con la documentación:**
  - S3 usa la cabecera Host para elegir el bucket (`bucket.s3.region.amazonaws.com`) **[fuente]**.
  - CloudFront devuelve 403 si la petición llega a un nombre que no está en los alternate domain names de la distribución **[fuente]**.
  - CloudFront es cliente de TLS hacia el origen: valida el certificado y da 502 si está vencido, autofirmado o con la cadena incompleta **[fuente]**.
  - «Redirect HTTP to HTTPS» de CloudFront da 301 a GET y HEAD, y 307 a los demás métodos **[fuente]** y **[local]** (4.7).
  - La política de cabeceras de respuesta incluye `Strict-Transport-Security` **[fuente]**.
  - Los espectadores usan HTTP/3 con TLS 1.3 y SNI **[fuente]**.
  - S3 devuelve 404 si el solicitante puede listar el bucket y 403 si no **[fuente]** (4.1).
- **No asume:** caché HTTP, TTL de CloudFront, CORS, URL prefirmada, Origin Access Control (sección 5).

### Capítulo 13, «Una API sin servidores»

- **Ficha:** «una petición HTTP que API Gateway convierte en un evento para Lambda, y su respuesta», «errores de CORS», «502, timeouts». Pregunta: «¿Qué viaja entre API Gateway y Lambda y cómo se ven los errores típicos (permiso, timeout, 502)?»
- **Da por sabido:** `http-request`, `http-response`, `http-method`, `url-path`, `http-header`, `status-code`, `status-200`, `status-400*`, `status-401`, `status-403`, `status-429`, `status-500*`, `status-502`, `status-504`, `authorization-header`, `json`, `api`, `rest`, `https`, `tls-termination`, `persistent-connection`, `idle-timeout`, `curl`.
- **Por qué:**
  - La integración proxy de Lambda exige que la función devuelva un JSON con `statusCode`, `headers` y `body`; si el formato es otro, API Gateway devuelve 502 **[fuente]** (`set-up-lambda-proxy-integrations`).
  - Las respuestas propias de API Gateway tienen códigos fijos: 403 para `MISSING_AUTHENTICATION_TOKEN`, `ACCESS_DENIED`, `INVALID_SIGNATURE` y `WAF_FILTERED`; 401 para `UNAUTHORIZED`; 429 para `THROTTLED`; 504 para `INTEGRATION_TIMEOUT` **[fuente]** (4.1 y 6.1).
  - «REST API» y «HTTP API» son **nombres de producto** de API Gateway: «both RESTful API products» **[fuente]**. No son REST ni HTTP en sentido estricto (4.10).
- **No asume:** ruta de API Gateway (route key), integración, etapa, evento y contexto de Lambda, CORS (se explica en el 9).

### Capítulo 20, «Proteger la app»

- **Ficha:** «peticiones legítimas y ataques hacia CloudFront, el balanceador y API Gateway, y un token de inicio de sesión hasta el authorizer»; configura «reglas de WAF, límites de tasa y el authorizer». Pregunta: «¿Cómo viaja un token de Cognito hasta API Gateway y por qué lo rechaza?»
- **Da por sabido:**
  - **Lo que una regla de WAF mira:** AWS WAF inspecciona método HTTP, cabecera única o todas, cookies, path, query string, parámetros, cuerpo, cuerpo JSON y «forwarded IP addresses» **[fuente]** (`waf-rule-statement-fields`). Son `http-method`, `http-header`, `cookie*`, `url-path`, `query-string*`, `json`, `x-forwarded-for*`.
  - **Lo que devuelve un bloqueo:** 403 en ALB, API Gateway y CloudFront **[fuente]**; un código propio es posible **[fuente]** (access log del ALB). Un límite de tasa es lo que justifica `status-429`.
  - **Por qué un authorizer rechaza:** `authentication`, `authorization`, `status-401`, `status-403`, `authorization-header`.
  - **Cómo se valida un token:** un authorizer JWT de API Gateway comprueba el algoritmo y la **firma** con la **clave pública** que baja de `jwks_uri` del emisor, y solo admite algoritmos RSA **[fuente]** (`http-api-jwt-authorizer`). Son `digital-signature`, `public-key`, `asymmetric-encryption`.
  - **Lo del inicio de sesión:** `redirect`, `cookie*`, `hsts*`.
- **No asume:** token, JWT, OAuth, OIDC, Cognito, tipos de ataque, bots, DDoS. Son del 20. «Token» tiene tres sentidos en el curso (4.15).

### Otros capítulos que también lo usan

| Capítulo | Qué toma del 3 |
|----------|----------------|
| 8, «Quién puede hacer qué» | `json` (las políticas de IAM son JSON), `authentication`, `authorization`, `encryption`, `symmetric-encryption`, `asymmetric-encryption`, `private-key`, `digital-signature`, `session-key*`. La página de claves de KMS habla de claves simétricas y de «RSA or elliptic curve private key» **[fuente]**. El cifrado de sobre es del 8 |
| 10, 11 | `encryption` (cifrado de bases y discos [inferencia]); `hash` (resumen de una imagen [inferencia]); `process` (un contenedor es un proceso aislado [inferencia]; lo define el 11) |
| 14, «Mensajes y eventos» | `idempotent` (la ficha pide «reintentos e idempotencia») |
| 16, «Ver lo que pasa» | `client-error`, `server-error`, `status-code`: los logs de acceso y las métricas del ALB separan `elb_status_code` y `target_status_code` **[fuente]** |
| 18, 19 | `json` (JSON, YAML y HCL); `client-error`, `server-error` (alarma de 5xx como disparador de rollback) |
| 23, «IA generativa en tu app» | `api`, `json`, `status-429`, `status-403` (una llamada a un modelo es una petición HTTPS con cuerpo JSON [inferencia]) |

---

## 4. Correcciones de rigor

Cada punto: lo que dicen los tutoriales, cómo es, y la fuente. Lo que probé yo lo marco **[local]**.

### 4.1 401 frente a 403

- **Error frecuente:** «401 es no tienes permiso y 403 es prohibido», o «son lo mismo».
- **Cómo es:**
  - **401:** la petición «lacks valid authentication credentials». El servidor DEBE mandar `WWW-Authenticate` con al menos un reto. Si la petición ya traía credenciales, el 401 dice que fueron rechazadas (RFC 9110 §15.5.2) **[fuente]**.
  - **403:** el servidor «understood the request but refuses to fulfill it». Si había credenciales, las considera insuficientes. El cliente NO DEBE repetir la petición con las mismas (§15.5.4) **[fuente]**.
  - **Los nombres engañan.** El 401 se llama «Unauthorized» y la cabecera se llama «Authorization». Las dos hablan de **autenticación**: la cabecera «allows a user agent to authenticate itself» (§11.6.2) **[fuente]**.
- **Un 403 puede esconder un 404.** «An origin server that wishes to "hide" the current existence of a forbidden target resource MAY instead respond with a status code of 404» (§15.5.4) **[fuente]**.
- **S3 hace lo contrario.** Si el objeto no existe y el solicitante tiene `s3:ListBucket`, devuelve 404. Si no la tiene, devuelve 403 Access Denied **[fuente]** (`API_GetObject`). Un 403 de S3 puede significar «no existe».
- **AWS no respeta la raya limpia.**

| Quién | Código | Causa | Fuente |
|-------|--------|-------|--------|
| API Gateway (REST) | 403 | `MISSING_AUTHENTICATION_TOKEN`, incluso si pides un método o recurso que no existe | `supported-gateway-response-types` |
| API Gateway (REST) | 403 | `ACCESS_DENIED` (un authorizer lo negó), `EXPIRED_TOKEN`, `INVALID_SIGNATURE`, `INVALID_API_KEY`, `WAF_FILTERED` | ídem |
| API Gateway (REST) | 401 | `UNAUTHORIZED` (el authorizer no pudo autenticar) | ídem |
| ALB | 401 | La acción de autenticar (OIDC o Cognito) rechazó o el JWT falló | `load-balancer-troubleshooting` |
| ALB | 403 | AWS WAF bloqueó la petición | ídem |
| CloudFront | 403 | WAF, restricción geográfica, URL firmada, un 403 del origen, o un nombre alterno mal configurado | `http-403-permission-denied` |

- **Consecuencia:** en AWS el número no basta. Hay que saber quién lo generó. CloudFront lo dice así: no puede distinguir un 403 de su origen de uno del WAF que está delante **[fuente]**.

### 4.2 502, 503 y 504: quién los genera

- **Error frecuente:** «502 es que la app se cayó», «504 es que la app es lenta», «503 es que todas las instancias están unhealthy», «los 5xx siempre los genera mi código».
- **Qué dice el estándar** (RFC 9110 §15.6) **[fuente]**:
  - **502:** «while acting as a gateway or proxy, received an invalid response from an inbound server».
  - **503:** «currently unable to handle the request due to a temporary overload or scheduled maintenance». Puede traer `Retry-After`.
  - **504:** «while acting as a gateway or proxy, did not receive a timely response from an upstream server».
  - **«Gateway» es un proxy inverso** (§3.7): «A "gateway" (a.k.a. "reverse proxy") is an intermediary that acts as an origin server for the outbound connection but translates received requests and forwards them inbound». No es el router del capítulo 1.
  - **Una petición que pasa por un intermediario usa conexiones separadas.** La figura 2 del §3.7 muestra cuatro conexiones entre el agente y el origen cuando hay tres intermediarios.
- **Qué hace el intermediario con lo que no es un error suyo.** Pasa la respuesta del origen tal cual. MDN: «If the origin server sends a valid HTTP error response to the gateway, the response should be passed on to the client instead of a 502» **[fuente]**. AWS lo dice del ALB: «forwards valid HTTP responses from targets to the client, including HTTP errors» **[fuente]**.
- **Cómo se separa en el ALB.** Las métricas se llaman `HTTPCode_ELB_5XX_Count` (las genera el balanceador) y `HTTPCode_Target_5XX_Count` (las genera el target). El log de acceso tiene `elb_status_code` («generated by the load balancer, fixed response rule, or AWS WAF custom response code for Block actions») y `target_status_code` («recorded only if a connection was established to the target and the target sent a response») **[fuente]**.

**Causas en un ALB** (página «Troubleshoot your Application Load Balancers») **[fuente]**:

| Código | Causas que AWS lista |
|--------|----------------------|
| 502 | Recibió un TCP RST del target al conectar. Recibió «ICMP Destination unreachable». El target cerró la conexión (RST o FIN) con una petición en curso: «Check whether the keep-alive duration of the target is shorter than the idle timeout value of the load balancer». Respuesta mal formada o con cabeceras inválidas. Cabeceras de respuesta de más de 32 K. Terminó el tiempo de «deregistration delay». Errores de Lambda como target. Error en el saludo TLS hacia el target |
| 503 | «The target groups for the load balancer have no registered targets, or all of the registered targets are in an unused state». Más una causa de un modo opcional (target optimizer) |
| 504 | No logró conectar al target en 10 s. Conectó y el target no respondió antes del idle timeout. La network ACL no deja volver a los puertos efímeros 1024 a 65535. El target manda un `content-length` mayor que el cuerpo. Un saludo TLS que pasa de 10 s |

- **El mito del 503.** «Todos los targets unhealthy» **no** da 503 en un ALB. Da el contrario: «If a target group contains only unhealthy registered targets, the load balancer routes requests to all those targets, regardless of their health status … the load balancer fails open» **[fuente]** (`target-group-health-checks`). Lo que se ve entonces depende de los targets (502, 504 o respuestas buenas).
- **Idle timeout por defecto del ALB: 60 segundos** **[fuente]** (`edit-load-balancer-attributes`).
- **El caso del desarrollador de Node.** `http.Server.keepAliveTimeout` vale **5000 ms** por defecto (más 1000 ms de `keepAliveTimeoutBuffer` desde Node 24.6) **[fuente]** (docs de Node) y **[local]** (`createServer()` sin `listen`, Node v24.14.0). El ALB reutiliza la conexión persistente durante 60 s. Si Node la cierra a los 5 s, la siguiente petición del ALB cae en una conexión muerta y el cliente ve un 502. RFC 9112 §9.5 describe la carrera: un extremo cierra «idle» una conexión mientras el otro ya envió una petición **[fuente]**.
- **NLB:** «functions at the fourth layer» **[fuente]**. No lee HTTP. Que por eso no genere códigos de estado HTTP es **[inferencia]**: no encontré una frase que lo diga.
- **CloudFront (también es un proxy inverso)** **[fuente]**:
  - **502:** no pudo conectar con el origen. Con HTTPS al origen, el certificado debe incluir un nombre que coincida con el Origin Domain o con el Host de la petición al origen. Si el origen presenta un certificado vencido, inválido, autofirmado o con la cadena en mal orden, CloudFront corta la conexión TCP y devuelve 502. Lo mismo si falta un intermedio.
  - **504:** el origen devolvió 504, no respondió a tiempo, o un firewall o Security Group le bloquea el paso.
  - **503:** el origen no da abasto o hay falta de recursos en el borde. Con S3 de origen, la página asocia el «503 Slow Down» a un ritmo excesivo sobre un prefijo (cita 3 500 PUT/COPY/POST/DELETE o 5 500 GET/HEAD por segundo y prefijo).
- **API Gateway (REST)** **[fuente]**: 502 si la Lambda (integración proxy) devuelve algo fuera del formato esperado. 504 con `INTEGRATION_FAILURE` o `INTEGRATION_TIMEOUT`. El timeout de integración es de 50 ms a **29 segundos**. En APIs regionales y privadas se puede subir por encima de 29 s «but this might require a reduction in your Region-level throttle quota»; en las optimizadas para el borde no (`api-gateway-execution-service-limits-table`).
- **Qué no sé:** qué código devuelve API Gateway cuando la función Lambda de una integración proxy lanza una excepción. La página dice qué hacer, no el código. **[sin verificar]**.

### 4.3 HTTPS no es otro protocolo

- **Error frecuente:** «HTTPS es otro protocolo», «HTTPS es la versión 2 de HTTP», «HTTPS siempre va por el 443», «necesito un certificado SSL».
- **Cómo es:**
  - El esquema `https` identifica un servidor «capable of establishing a TLS connection that has been secured for HTTP communication». Su puerto por defecto es el 443 «(the reserved port for HTTP over TLS)» (RFC 9110 §4.2.2) **[fuente]**. Los mensajes son los mismos que en `http`.
  - Lo que cambia: el cliente DEBE asegurar la petición antes de enviarla y DEBE verificar la identidad del servidor (§4.2.2 y §4.3.4) **[fuente]**.
  - `http://x` y `https://x` son «distinct origins with separate namespaces» (§4.2.2) **[fuente]**.
  - El RFC 2818 («HTTP over TLS») fue reemplazado por el 9110 **[fuente]** (el encabezado del 9110 dice «Obsoletes: 2818»).
- **El puerto es costumbre, no regla.** Lo probé al revés **[local]** (2026-10-11):
  - HTTP en claro al 443 de `example.com`: `400 The plain HTTP request was sent to HTTPS port`.
  - HTTPS al puerto 80: `curl: (35) … tlsv1 alert protocol version`. Node v24.14.0: `ERR_SSL_PACKET_LENGTH_TOO_LONG` (el servidor contestó texto HTTP y TLS lo leyó como un registro corrupto).
  - Ninguno es un código de estado de la app ni un error de DNS. Es un desajuste entre lo que escucha el proceso y lo que habla el cliente.
- **«Certificado SSL» es un nombre viejo.** SSL 3.0 está prohibido (RFC 7568) y TLS 1.0 y 1.1 están en desuso (RFC 8996) **[fuente]**. AWS aún escribe «SSL/TLS X.509 certificates» en su documentación de ACM **[fuente]**. Recomendación: decir TLS; aceptar «SSL/TLS» solo donde la consola de AWS lo dice.
- **TLS no es HTTPS.** TLS protege otros protocolos además de HTTP (el RFC 9110 solo define el esquema `https`). [inferencia: SMTP, bases de datos, MQTT]

### 4.4 Qué cifra y qué no cifra TLS

- **Error frecuente:** «HTTPS cifra todo», «con HTTPS nadie ve a qué sitio entro», «el certificado viaja en claro».
- **Cómo es, por dato.** Para quien mira la red entre el cliente y el servidor:

| Dato | ¿Lo ve? | Fuente |
|------|---------|--------|
| IP de origen y de destino | Sí | Van en el encabezado del paquete (capítulo 1) |
| Puerto de destino y de origen | Sí | Van en el encabezado de TCP (capítulo 2) |
| La consulta DNS con el nombre | Sí, salvo DNS cifrado | RFC 9849 §1: «plaintext client DNS queries» **[fuente]** |
| El SNI (nombre del servidor) | Sí, salvo con ECH | RFC 6066 §3 define el campo en el ClientHello; RFC 9849 §1: «perhaps the most sensitive information left unencrypted in TLS 1.3» **[fuente]** |
| Versiones y cifrados que ofrece el cliente, y la lista ALPN (`h2`, `http/1.1`, `h3`) | Sí, salvo ECH para ALPN | RFC 8446 §2; RFC 9849 §1 **[fuente]** |
| El certificado del servidor | **TLS 1.2: sí. TLS 1.3: no** | TLS 1.3: RFC 8446 §1.2: «All handshake messages after the ServerHello are now encrypted» **[fuente]**. TLS 1.2: la Figura 1 del RFC 5246 manda `Certificate` antes del primer `ChangeCipherSpec`; que por eso viaje en claro se lee en la figura **[inferencia]** |
| Método, path, query string, cabeceras, cookies, cuerpo, código de estado | No | Van dentro de TLS. Es la definición de `https` (RFC 9110 §4.2.2) **[fuente]** |
| Tamaño y momento de los mensajes | Sí | **[inferencia]**. RFC 9849 §1 habla del «division of data into record-layer boundaries» como comportamiento visible |

- **ECH no basta.** El RFC 9849 (marzo de 2026) dice: «ECH is not in itself sufficient to protect the identity of the server. The target domain may also be visible through other channels, such as plaintext client DNS queries or visible server IP addresses» **[fuente]**. Qué navegadores y servidores lo tienen hoy: **[sin verificar]**.
- **Si se entra por IP no hay SNI.** «Literal IPv4 and IPv6 addresses are not permitted in "HostName"» (RFC 6066 §3) **[fuente]**.
- **Lo que TLS no protege:**
  - **Lo que pasa después de la terminación.** Un ALB con un listener HTTPS descifra la petición. Hacia el target puede ir en claro, o con otro TLS que el ALB **no valida**: «The load balancer does not validate these certificates. Therefore, you can use self-signed certificates or certificates that have expired» **[fuente]** (`load-balancer-target-groups`). AWS lo justifica porque el tráfico dentro de la VPC está autenticado «at the packet level». CloudFront, en cambio, **sí** valida el certificado del origen (4.2).
  - **Al servidor mismo.** TLS asegura con quién hablas y que nadie en medio lee ni cambia. No asegura que el servidor sea honesto.
  - **«El candado es un sitio seguro».** El blog de Chromium (2023-05-02): «the lock icon does not indicate website trustworthiness». Anuncia un icono neutro para Chrome 117 (septiembre de 2023) **[fuente]**. Si ya se desplegó: **[sin verificar]**. La página de conceptos de ACM aún dice que el navegador «displays a lock icon» **[fuente]**.
- **Prueba [local]** (2026-10-11):
  - `openssl s_client -connect example.com:443 -servername example.com`: saludo completo, TLS 1.3, cadena de 4 certificados.
  - Con `-noservername`: `tls alert handshake failure` (alerta 40).
  - Con `-servername www.not-example-xyz.test`: el mismo error. El servidor no tiene qué certificado dar.
  - `curl -v` imprime `Certificate (11)` en TLS 1.3 porque `curl` ya descifró ese mensaje, no porque viaje en claro.

### 4.5 Certificado frente a clave privada

- **Error frecuente:** «el certificado es el archivo secreto», «el navegador cifra la clave de sesión con la clave pública del servidor y el servidor la descifra con la privada».
- **Cómo es:**
  - **El certificado es público.** Une nombres a una clave **pública** y lo firma una autoridad (RFC 5280 §4). Se manda a cualquiera que se conecte. Perderlo no compromete a nadie.
  - **La clave privada es el secreto.** Quien la tiene puede hacerse pasar por el servidor mientras el certificado siga vigente.
  - **En TLS 1.3 la clave privada del certificado no descifra nada. Firma.** El mensaje `CertificateVerify` es «A signature over the entire handshake using the private key corresponding to the public key in the Certificate message» (RFC 8446 §2) **[fuente]**. La clave de sesión sale de un intercambio efímero ((EC)DHE, `key_share`), no de cifrar con el certificado.
  - **«Static RSA and Diffie-Hellman cipher suites have been removed»** (RFC 8446 §1.2) **[fuente]**. La explicación «cifro con la pública, descifro con la privada» fue cierta en TLS 1.2 con intercambio RSA («public-key-encrypted PreMasterSecret», RFC 5246 §7.4.7.1) **[fuente]**.
  - **Se manda más que el certificado de la hoja.** El servidor manda la cadena. Puede omitir la raíz «provided that supported peers are known to possess any omitted certificates» (RFC 8446 §4.4.2) **[fuente]**.
- **En AWS:**
  - ACM «uses your AWS KMS key to encrypt the private key» **[fuente]** (`acm-concepts`). Aquí aparece KMS en la historia de ACM (pregunta 2 de la ficha).
  - Los certificados de ACM duran **198 días** y se renuevan 45 días antes de vencer **[fuente]**.
  - ACM tiene hoy «exportable public certificates», con cargo extra: se pueden sacar el certificado, la clave y la cadena **[fuente]** (`acm-exportable-certificates`). La página no dice desde cuándo. La frase «ACM nunca te da la clave» ya no es siempre cierta.
  - Desde el 2025-06-11 ACM ya no emite certificados con `clientAuth` en el uso ampliado de la clave **[fuente]**.

### 4.6 Qué valida un cliente de un certificado

- **Error frecuente:** «el nombre va en el CN», «mientras el certificado sea de una autoridad conocida, vale».
- **Qué se valida, por orden:**

| Qué | Cómo es | Fuente |
|-----|---------|--------|
| **El nombre** | Se compara con el **SAN** (`dNSName`, o `iPAddress` si el host es una IP). «A reference identity of type CN-ID MUST NOT be used by clients» | RFC 9110 §4.3.4 **[fuente]**. RFC 9525 §1.3: «Only check DNS domain names via the subjectAltName extension»; «The Common Name RDN MUST NOT be used to identify a service» **[fuente]** |
| **El nombre sale de la URL, no de la IP** | El cliente construye la identidad de referencia «from the service's host» | RFC 9110 §4.3.4 **[fuente]** |
| **El comodín** | Solo como «the complete content of the left-most label», y «can only match one label» | RFC 9525 §6.3 **[fuente]** |
| **La cadena** | Hasta un ancla de confianza que el cliente tenga configurada | RFC 9110 §4.3.4; RFC 5280 §6.1 **[fuente]** |
| **Las fechas** | «from notBefore through notAfter, inclusive». Depende del reloj del cliente | RFC 5280 §4.1.2.5 **[fuente]**. El reloj: **[inferencia]** |
| **Otras** | Firmas de la cadena, uso de la clave, revocación | RFC 5280 §6.1 **[fuente]** |

- **Un RFC reemplazó a otro.** RFC 9110 manda verificar con «Section 6 of [RFC6125]». El RFC 9525 (2023) **obsoleta** al 6125 **[fuente]** (encabezado de 9525: «Obsoletes: 6125»). Se cita el 9525.
- **Los navegadores ya lo hacían.** Chrome 58 quitó el CN: «Remove support for commonName matching in certificates». La entrada dice que Firefox exige el SAN desde la 48 y que los Baseline Requirements lo piden desde 2012 **[fuente]** (entrada de Chrome para desarrolladores; el dato de Firefox y de los Baseline Requirements es de segunda mano). La página dice «in beta as of March 16» y no trae el año.
- **AWS aún escribe «CN o SAN».** La página del ALB sobre SNI dice que se elige un certificado cuyo «CN or SAN matches that hostname»; la de CloudFront dice «Common Name or Subject Alternative Names» **[fuente]**. Es la selección del servidor, no la validación del cliente. ACM pone los nombres en el SAN (la página del ALB: «The wild-card name appears in the Subject field and in the Subject Alternative Name extension») **[fuente]**.
- **El comodín solo cubre un nivel y no cubre el dominio base.** ALB: `*.example.com` protege `corp.example.com`, no `test.login.example.com` ni `example.com` **[fuente]**. S3: el certificado comodín de los buckets «matches only buckets that do not contain dots» **[fuente]** (`VirtualHosting`).
- **La vida de los certificados se acorta.** ACM: 198 días **[fuente]**. Un certificado de `example.com` que vi: 90 días **[local]**. El ballot SC-081v3 de CA/Browser Forum propone bajar el máximo de 398 días a 47 entre marzo de 2026 y marzo de 2029 **[fuente]** (aviso de revisión, `cabforum.org`). Que se aprobó, y los pasos intermedios (200 días desde el 2026-03-15, 100 desde el 2027), los leí en fuentes secundarias (GlobalSign, ZeroSSL, DigiCert); no leí el texto de la balota. **[sin verificar]** el calendario exacto.
- **Cada cliente tiene su propia lista de confianza.** Node trae «a snapshot of Mozilla CA store» y acepta `--use-system-ca` y `NODE_EXTRA_CA_CERTS` **[fuente]**.
- **`NODE_TLS_REJECT_UNAUTHORIZED=0` no es un arreglo.** «Certificate validation is disabled for TLS connections. This makes TLS, and HTTPS by extension, insecure» **[fuente]**. Apaga la verificación de todo el proceso.
- **Los cinco fallos, con lo que imprime cada herramienta [local]** (2026-10-11, contra `badssl.com`, un sitio de pruebas público):

| Caso | `curl` 8.7.1 (macOS) | Node v24.14.0 |
|------|----------------------|---------------|
| Vencido (`expired`) | `(60) SSL certificate problem: certificate has expired` | `CERT_HAS_EXPIRED` |
| Otro nombre (`wrong.host`) | `(60) SSL: no alternative certificate subject name matches target host name` | `ERR_TLS_CERT_ALTNAME_INVALID` — «Host: wrong.host.badssl.com. is not in the cert's altnames: DNS:*.badssl.com, DNS:badssl.com» |
| Autofirmado (`self-signed`) | `(60) SSL certificate problem: self signed certificate` | `DEPTH_ZERO_SELF_SIGNED_CERT` |
| Raíz desconocida (`untrusted-root`) | `(60) … self signed certificate in certificate chain` | `SELF_SIGNED_CERT_IN_CHAIN` |
| **Cadena incompleta** (`incomplete-chain`) | **funciona (200)** | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` |

- **Lo de la cadena incompleta.** `curl` en macOS la aceptó; Node falló; `openssl s_client` dio `verify error:num=21:unable to verify the first certificate`. Por qué el sistema la completa (traer el intermedio de la propia extensión del certificado, tenerlo en caché o ya instalado) no lo verifiqué: **[sin verificar]**. CloudFront, como cliente, no la completa **[fuente]**.
- **Una observación del comodín** **[local]**: `*.badssl.com` **no** cubre `wrong.host.badssl.com`, que tiene dos niveles. El mensaje de Node lo enseña.
- **Caso real de nombre** **[fuente]**: en la dirección por defecto del ALB (`*.elb.amazonaws.com`) un navegador da `NET::ERR_CERT_COMMON_NAME_INVALID`, porque «a public certificate cannot be requested for the *.amazonaws.com domain». Y el nombre del error dice «common name», pero la comprobación es contra el SAN.

### 4.7 La redirección a HTTPS: 301, 302, 307 o 308

- **Error frecuente:** «da igual cuál»; «una redirección protege a todos los clientes»; «la 301 se puede deshacer».
- **Cómo es** (RFC 9110 §15.4) **[fuente]**:
  - **301 y 302:** «a user agent MAY change the request method from POST to GET». Si no se quiere, la nota manda a 308 y 307.
  - **307:** el agente DEBE mantener el método (§15.4.8). **308:** «much younger (June 2014) … might not be recognized everywhere» (§15.4.9).
  - **Caché.** El RFC dice que una 301 y una 308 son «heuristically cacheable» (§15.1, §15.4.2 y §15.4.9). La 302 y la 307 no están en esa lista. Una 301 equivocada puede quedarse en la caché de los navegadores.
  - La nota de la sección 15.4 cuenta la historia: «307 … and 308 … were later added to unambiguously indicate method-preserving redirects, and status codes 301 and 302 have been adjusted to allow a POST request to be redirected as GET».
  - **303 y 304** también son 3xx. La 303 manda a un GET. La 304 **no** redirige: «redirection to a previously stored result». Por eso la definición de `redirección` no los nombra.
- **Qué hace AWS:**
  - **ALB:** la acción de redirección admite «temporary (HTTP 302) or permanent (HTTP 301)». Nada más. Se puede pasar de HTTP a HTTPS y de HTTPS a HTTPS, pero «You cannot redirect HTTPS to HTTP» **[fuente]** (`rule-action-types`).
  - **CloudFront:** «Redirect HTTP to HTTPS» da **301** a GET y HEAD y **307** a POST, PUT, DELETE, OPTIONS y PATCH (con HTTP/1.1 o más). Con HTTP/1.0 esos métodos reciben 403. Y la política «HTTPS only» responde **403** a cualquier petición HTTP; no redirige **[fuente]**.
- **Prueba [local]** (2026-10-11):
  - `HEAD http://aws.amazon.com/` → `301 Moved Permanently`, `Location: https://aws.amazon.com/`, `X-Cache: Redirect from cloudfront`.
  - `POST http://aws.amazon.com/` → `307 Temporary Redirect`.
  - `curl -L -d x=1 http://github.com/` (una 301): terminó en `GET` y `200`. `curl -L -d x=1 http://aws.amazon.com/` (una 307): terminó en `POST` y `405`, porque la página no admite POST. El método se conservó.
  - `fetch` de Node con `POST` a la misma 301: siguió la redirección y terminó en `200`. No imprimí el método. La especificación Fetch no la leí.
- **Consecuencias:**
  - Una 301 protege al navegador (GET). A un cliente de API que haga POST a `http://` le puede llegar un GET sin cuerpo y sin error. Con un ALB solo hay 301 y 302. [inferencia]
  - La redirección necesita que el **puerto 80 esté abierto y escuchando**. Con el firewall cerrado en el 80, el cliente ve un timeout (capítulo 2), no una redirección.
  - **Detrás de una terminación de TLS, la app ve HTTP.** Si ella redirige a HTTPS en cada petición HTTP, se queda en un bucle. El ALB manda `X-Forwarded-Proto` para eso **[fuente]**; que la app lo lea es lo que lo evita [inferencia]. Express lo llama `trust proxy` **[sin verificar]**.

### 4.8 HSTS

- **Error frecuente:** «HSTS reemplaza a la redirección», «HSTS protege la primera visita», «es una cabecera que pongo y ya».
- **Cómo es** (RFC 6797) **[fuente]**:
  - **Solo vale por HTTPS.** El agente DEBE ignorar la cabecera si llega por transporte inseguro (§8.1). El servidor NO DEBE mandarla por HTTP (§7.2).
  - **No cubre la primera visita.** El RFC lo llama «Bootstrap MITM Vulnerability» (§14.6): la primera petición, si fue `http://`, viaja sin protección. La salida son listas precargadas. La precarga **no está en el RFC**; MDN dice que exige `max-age` de al menos 1 año, `includeSubDomains` y `preload` **[fuente]** (MDN).
  - **No reemplaza a la redirección.** El RFC pide que un servidor HSTS responda a una petición por transporte inseguro con una redirección permanente a `https` («SHOULD», §7.2). Quien aún no conoce la política solo tiene la redirección.
  - **No aplica a IP.** Un host que es una IP no coincide con ningún host conocido (§8.3 paso 3). Cambia `http://…:80` a `https://…:443` (§8.3).
  - **Desactiva el «continuar de todos modos».** Al conectar con un host conocido, el agente DEBE cortar ante «any errors, whether "warning" or "fatal"», incluidos los de la validación del certificado (§8.4).
  - **`max-age` es una vida** («a "time to live" value relative to the reception time»); `max-age=0` borra la política (§8.1).
  - **`includeSubDomains`** extiende la política a los subdominios (§6.1.2).
- **Consecuencia:** un certificado vencido con HSTS vigente deja el sitio inalcanzable para quien ya lo visitó, sin botón para saltarse el aviso.
- **En la práctica [local]** (2026-10-11): `https://aws.amazon.com/` manda `strict-transport-security: max-age=47304000; includeSubDomains`. `https://github.com/` manda `max-age=31536000; includeSubdomains; preload`.
- **AWS:** la política de cabeceras de respuesta de CloudFront incluye `Strict-Transport-Security` entre las cabeceras de seguridad **[fuente]**. Si el ALB o API Gateway la añaden: **[sin verificar]**; no encontré esa función.

### 4.9 HTTP/1.1, HTTP/2 y HTTP/3: ¿cabe HTTP/3?

- **Error frecuente:** «HTTP va por el 80 y HTTPS por el 443, siempre TCP», «HTTP/2 es otro HTTP».
- **Cómo es:**
  - **La semántica es una sola** (RFC 9110): métodos, URL, cabeceras, códigos. Cambia cómo se empaqueta y por qué transporte viaja.
  - **HTTP/1.1** (RFC 9112): mensajes de texto sobre TCP. **Exige** la cabecera Host (§3.2) **[fuente]**.
  - **HTTP/2** (RFC 9113): tramas binarias y varias peticiones a la vez en una conexión. El identificador `h2` es para HTTP/2 sobre TLS; `h2c` (sin TLS) quedó en desuso como mecanismo de `Upgrade` **[fuente]**.
  - **HTTP/3** (RFC 9114): sobre QUIC. «QUIC packets are carried in UDP datagrams» y usa TLS 1.3 (RFC 9001) **[fuente]**. HTTP/3 no existe sin cifrado.
  - **Cómo lo descubre el cliente.** Por la cabecera `Alt-Svc` (RFC 9114 §3.1.1) **[fuente]**. **[local]**: `example.com` manda `alt-svc: h3=":443"; ma=86400`.
  - **Si el UDP está bloqueado.** «Connectivity problems (e.g., blocking UDP) can result in a failure to establish a QUIC connection; clients SHOULD attempt to use TCP-based versions of HTTP in this case» (RFC 9114 §3.1) **[fuente]**.
  - **El puerto.** IANA registra `https` en **443/tcp y 443/udp** (referencia RFC 9110) **[fuente]** (CSV consultado el 2026-10-11). **Esto cierra el «sin verificar» de la investigación del capítulo 2** sobre qué usa el 443/udp.
  - **`curl -v` no muestra el HTTP/2 real.** Con `--http2` imprime `> GET / HTTP/2` y `> Host: example.com`, pero la trama lleva `:method`, `:scheme`, `:authority` y `:path`. Las dos líneas son una reconstrucción **[local]**.
- **En AWS:**
  - **ALB:** HTTP/2 «with HTTPS listeners»; la lista de protocolos de la página es «HTTP, HTTPS». No habla de HTTP/3 **[fuente]**. Que otra página lo cubra: **[sin verificar]**.
  - **NLB:** tiene listeners `QUIC` y `TCP_QUIC` que reenvían sin descifrar («acts as a pass through load balancer») **[fuente]**.
  - **CloudFront:** HTTP/3 para espectadores, que deben soportar TLS 1.3 y SNI **[fuente]**.
- **¿Cabe o queda fuera?** **Cabe, en pequeño.** Una sola pieza de Apoyo (`versiones de HTTP`) y la regla «una regla de firewall que abre TCP 443 **no** abre HTTP/3».
  - **A favor:** el capítulo 2 ya tiene UDP y la regla de protocolo más rango de puertos. El NLB y CloudFront usan el nombre. Sin esto, el jugador sale con «HTTPS = TCP 443» y se confunde cuando un cliente cae a TCP.
  - **En contra:** la mecánica de QUIC no cabe y no hace falta.
  - **Ojo con el nombre `conexión`:** en el capítulo 2 es TCP. El 3 no debe llamar «conexión» a lo de QUIC.

### 4.10 REST no es «JSON por HTTP»

- **Error frecuente:** «una API REST es una API que devuelve JSON por HTTP», «si usa verbos HTTP, es REST».
- **Cómo es:**
  - REST es un **estilo de arquitectura** con restricciones. Fielding: cliente-servidor, sin estado, caché, interfaz uniforme, sistema en capas y código bajo demanda (opcional). La interfaz uniforme tiene cuatro: «identification of resources; manipulation of resources through representations; self-descriptive messages; and, hypermedia as the engine of application state» (tesis, §5.1 y §5.2) **[fuente]**.
  - Fielding en 2008: «I am getting frustrated by the number of people calling any HTTP-based interface a REST API» y «if the engine of application state … is not being driven by hypertext, then it cannot be RESTful and cannot be a REST API. Period.» **[fuente]**.
  - MDN: las API HTTP «are sometimes colloquially referred to as RESTful … although they don't necessarily adhere to all REST constraints» **[fuente]**.
  - **AWS:** «REST APIs and HTTP APIs are both RESTful API products» **[fuente]** (`http-api-vs-rest`). Son productos de API Gateway con funciones distintas, no un diploma.
  - **JSON** es solo un formato (RFC 8259). REST no lo exige y usar JSON no lo hace REST.
- **Recomendación para los textos:** definir REST como el estilo (como hace la tabla). Llamar «API web» a la que solo usa recursos, URL y métodos. Decir «REST API» o «HTTP API» solo con el sentido de producto de API Gateway, en el 13. La definición de `rest` en la tabla dice «y enlaces» a propósito.
- **JSON no es un objeto de JavaScript** (RFC 8259 §2 a §7). Lo probé en Node v24.14.0 **[local]**:
  - `{'a':1}` (comillas simples), `{a:1}` (clave sin comillas), `{"a":1,}` (coma final), `{"a":NaN}` y un comentario dan `SyntaxError`.
  - `JSON.stringify({a:undefined, b:()=>1, c:NaN})` da `{"c":null}`.
  - `JSON.parse("9007199254740993")` da `9007199254740992`. RFC 8259 §6 avisa: se logra buena interoperabilidad con números de doble precisión IEEE 754, y más allá no.

### 4.11 Idempotencia de los métodos

- **Error frecuente:** «idempotente es que no tiene efectos», «es que devuelve lo mismo», «es lo mismo que seguro».
- **Cómo es** (RFC 9110 §9.2) **[fuente]**:
  - Idempotente: «the intended effect on the server of multiple identical requests with that method is the same as the effect for a single such request». Lo son PUT, DELETE y los métodos seguros.
  - **Seguro** es más fuerte: «essentially read-only». GET, HEAD, OPTIONS y TRACE son seguros (§9.2.1). Todo seguro es idempotente. No al revés (PUT, DELETE).
  - **Es del efecto pedido, no de la respuesta.** «The response might differ»: un segundo DELETE puede dar 404 y el estado del servidor es el mismo. El servidor puede registrar cada petición y sigue siendo idempotente.
  - **Para qué sirve.** El cliente puede repetir una petición idempotente si la conexión se cae antes de leer la respuesta. «A client SHOULD NOT automatically retry a request with a non-idempotent method…». «A proxy MUST NOT automatically retry non-idempotent requests».
  - **POST no lo es** por definición del método. Un recurso concreto puede diseñarse para serlo (§9.2.2).
- **Por qué importa más adelante:** el SDK reintenta (5), y los mensajes «al menos una vez» (14) piden operaciones idempotentes. El 3 da la propiedad del método; el 14 enseña el diseño. La clave de idempotencia (un token que manda el cliente) es del 14 **[sin verificar]** cómo la usan las API de AWS.

### 4.12 La cabecera Host y los hosts virtuales

- **Error frecuente:** «el servidor sabe el sitio por la IP», «Host es opcional».
- **Cómo es:**
  - **Una IP puede servir muchos sitios.** DNS apunta varios nombres a la misma IP (capítulo 2). La IP y el puerto no dicen cuál se pide. La cabecera Host «enabl[es] the origin server to distinguish among resources while servicing requests for multiple host names» (RFC 9110 §7.2) **[fuente]**.
  - **En HTTP/1.1 es obligatoria.** «A client MUST send a Host header field in all HTTP/1.1 request messages». «A server MUST respond with a 400 (Bad Request) status code to any HTTP/1.1 request message that lacks a Host header field» (RFC 9112 §3.2) **[fuente]**. En HTTP/2 y HTTP/3 la sustituye `:authority` (§7.2).
  - **Tres lugares donde viaja el mismo nombre,** con distinta protección:

| Dónde | Para qué | ¿Se ve en la red? |
|-------|----------|-------------------|
| La consulta DNS (capítulo 2) | Hallar la IP | Sí, salvo DNS cifrado |
| El SNI del saludo TLS | Que el servidor elija el **certificado** | Sí, salvo ECH |
| La cabecera Host | Que el servidor elija el **sitio** | No (va dentro de TLS) |

  - **Pueden diferir.** El servidor decide qué hace si no coinciden. RFC 9110 §15.5.20 define 421 Misdirected Request («directed at a server that is unable or unwilling to produce an authoritative response») **[fuente]**.
- **Prueba [local]** (2026-10-11, contra `example.com`, que está detrás de Cloudflare):
  - Sin Host (`curl --http1.1 -H 'Host:'`): `400 Bad Request`.
  - Con `Host: not-a-site.invalid` al mismo servidor: `409 Conflict`. Cada servidor decide (403, 404, 421, un sitio por defecto).
- **En AWS** **[fuente]**:
  - S3 usa Host para elegir el bucket. La página lo llama «virtual hosting … serving multiple websites from a single web server».
  - El health check del ALB manda `Host: <IP privada del target>[:puerto]`; la página avisa que «A virtual host configuration to respond to that host, or a default configuration, may be required».
  - CloudFront devuelve 403 si el nombre de la petición no está en los alternate domain names de la distribución.
  - CloudFront manda un Host al origen; el certificado del origen debe coincidir con el Origin Domain o con ese Host.
  - SigV4 firma la cabecera `host` (`host;x-amz-content-sha256;x-amz-date` en el ejemplo de AWS). Un proxy que la cambie rompe la firma. [inferencia]

### 4.13 HTTP es sin estado, y «sin estado» ya tiene tres sentidos

- **Cómo es:** «HTTP is defined as a stateless protocol, meaning that each request message's semantics can be understood in isolation» (RFC 9110 §3.3) **[fuente]**. Eso permite reusar conexiones con proxies y repartir peticiones entre servidores.
- **El estado se añade encima.** Una cookie lo lleva (RFC 6265 §1: «the user agent uses the metadata … to determine whether to return the name/value pairs in the Cookie header») **[fuente]**. Dato que sorprende: «cookies for a given host are shared across all the ports on that host, even though the usual "same-origin policy" used by web browsers isolates content retrieved via different ports» (RFC 6265 §1) **[fuente]**.
- **Tres sentidos de «sin estado» en el curso:**
  1. El protocolo HTTP (capítulo 3): cada petición se entiende sola.
  2. El firewall (capítulos 4 y 6): `stateful` y la network ACL.
  3. La app (capítulo 7): no guarda sesión en su memoria.
- **Recomendación:** el 3 dice «cada petición se entiende sola» y **no** registra «stateless». `stateful` es término del 4 y no puede aparecer antes.

### 4.14 Otros errores frecuentes

| Error | Cómo es | Fuente |
|-------|---------|--------|
| «El fragmento `#…` llega al servidor» | No: «the target URI excludes the reference's fragment component» y el fragmento lo resuelve solo el agente | RFC 9110 §7.1; RFC 3986 §3.5 **[fuente]** |
| «Un `200` significa que salió bien» | Significa que la petición se cumplió según el servidor. Muchas API devuelven 200 con un error en el cuerpo. Un health check de ALB acepta por defecto solo el 200, y puede aceptar de 200 a 499 | `target-group-health-checks` **[fuente]**. Lo de las API: **[inferencia]** |
| «Un 4xx siempre es culpa del cliente» | «seems to have erred». Un WAF que bloquea un tráfico legítimo da 403 | RFC 9110 §15.5 **[fuente]** |
| «Una regla `HTTP` filtra peticiones HTTP» | Un Security Group solo ve protocolo y puerto. En las reglas de ejemplo de AWS, «HTTP» es TCP 80 y «HTTPS» es TCP 443 | `security-group-rules-reference` **[fuente]** |
| «Un certificado dura un año o más» | ACM: 198 días. El máximo público baja a 47 días hacia 2029 (4.6) | `acm-concepts` **[fuente]**; CA/B (4.6) |

### 4.15 Palabras que ya significan otra cosa

Cada fila es un riesgo de confusión que el texto del juego debe resolver con el nombre, no con una nota.

| Palabra | Sentidos en el curso | Qué hace el 3 |
|---------|----------------------|---------------|
| gateway | Puerta de enlace predeterminada (1, IP de un router). Proxy inverso (RFC 9110 §3.7: «gateway a.k.a. reverse proxy»; el 502 Bad Gateway). Internet gateway y NAT gateway (4 y 6). API Gateway (13) | «proxy inverso» y los nombres oficiales de códigos |
| ruta, path, route | Ruta de reenvío (2). Path de la URL (3). Route de API Gateway (13: «ruta» en la ficha) | «path» para la URL |
| origen | IP de origen (1). Puerto de origen (2). Servidor de origen (HTTP y CloudFront, 3 y 9). Origin de CORS: esquema, host y puerto (9) | «servidor de origen». CORS queda para el 9 con un nombre propio |
| host | Dispositivo (1). Nombre en una URL y cabecera Host (3). Host virtual | «cabecera Host» y «host virtual»; «host» solo no es término |
| header, encabezado, cabecera | Encabezado del paquete (1). Cabecera HTTP (3). `headers` del evento de Lambda (13) | «cabecera HTTP» |
| TTL | TTL de IP (1). TTL de DNS (2). Vida en caché de HTTP y de CloudFront (9). TTL de DynamoDB (15) | No lo toca. El 9 tendrá tres |
| timeout | Lo que ve quien no recibe nada (1). Idle timeout (3 y 7). Timeout de integración de API Gateway y de Lambda (13) | «idle timeout» (nombre de la consola del ALB) |
| conexión | TCP (2). TLS (3). QUIC | Dice «conexión TLS» solo sobre TCP; no nombra a QUIC |
| saludo | Saludo de tres pasos de TCP (2). Saludo TLS (3) | Nombres distintos |
| clave | Clave de cifrado (3). Clave de acceso de AWS (5). Clave de partición (15). Par de claves SSH | Dice «clave pública», «clave privada», «clave de sesión». «Clave» sola no es término |
| token | Token de acceso (20). Credencial temporal de STS (8). Token de un modelo de lenguaje (23) | No lo usa |
| sin estado | Ver 4.13 | No lo registra |
| REST API, HTTP API | Productos de API Gateway (13) | «REST» es el estilo; el producto se nombra en el 13 |
| resolver | Verbo y término (2) | Sin cambio |
| certificado | Certificado X.509 (3). `Certificate` de ACM (7) | Dice «certificado» para el documento |

---

## 5. Fuera de alcance y adónde va

| Concepto | Va a | Por qué |
|----------|------|---------|
| **CORS** (origin, política del mismo origen, preflight con OPTIONS, `Access-Control-*`) | **9** (primera vez en la ficha: «URL prefirmada y CORS»); lo reusa el 13 | Es un mecanismo del **navegador**. El Fetch Standard §3.3 lo define: «layered on top of HTTP and allows responses to declare they can be shared with other origins» **[fuente]**. MDN: la petición puede llegar al servidor; el navegador decide si deja leer la respuesta **[fuente]**. Un `curl` no lo aplica [inferencia]. El 3 da `navegador`, `url`, `cabecera HTTP`, `método HTTP` y `403`. «Origin» de CORS choca con «servidor de origen» (4.15) |
| Caché HTTP (`Cache-Control`, `ETag`, 304, `Vary`, clave de caché), TTL de caché | 9 | La ficha del 9 trae «caché» y «TTL». Es la tercera vez que aparece un TTL |
| Cookies en profundidad (`Secure`, `HttpOnly`, `SameSite`) | 20 (y 7 para la afinidad de sesión) | No leí RFC 6265 más allá de la introducción **[sin verificar]** |
| Token, JWT, OAuth, OIDC, Cognito, `Bearer` | 20 (y 19 para OIDC) | Ver 3, capítulo 20. El 3 da la cabecera Authorization, la firma digital y la clave pública |
| La firma de AWS (SigV4), HMAC, MAC | 5 | SigV4 es un hash con clave **[fuente]**, no la firma asimétrica del 3 |
| `endpoint`, credenciales, clave de acceso | 5 | Términos de AWS |
| Cifrado de sobre, claves de datos, políticas de claves, cifrado en reposo | 8 (luego 9 y 10) | Es KMS. El 3 da cifrado simétrico y asimétrico, hash y firma. «Cifrado en tránsito» queda dentro de `TLS` |
| ACM en detalle: validación por DNS (con un registro CNAME), renovación, regiones, importar, exportar | 7 (CloudFront exige la Región us-east-1: 9 **[fuente]**) | ACM valida el dominio con CNAME **[fuente]**. Es el uso del CNAME del capítulo 2 |
| Política de seguridad de TLS, suites de cifrado, versiones de TLS que acepta un listener | 7 | Es configuración del ALB y del NLB |
| TLS mutuo (certificados de cliente) | 13 y 20 (el NLB no lo soporta en un listener TLS: pasa por un listener TCP **[fuente]**) | Los certificados de cliente existen en TLS 1.3 (`CertificateRequest`, RFC 8446 §4.3.2 y §4.4.2) |
| Revocación (CRL, OCSP), Certificate Transparency, PKI, CA privada, ACME | 7 (lectura) y 26 / 32 | ACM los nombra en su página de conceptos; ninguno cambia un flujo del 3 |
| ECH, ALPN, huellas JA3 y JA4 | Sin capítulo claro; JA3/JA4 → 20 | El WAF ofrece JA3 y JA4 **[fuente]**. ECH y ALPN van en la nota de `SNI` |
| QUIC por dentro (0-RTT, migración de conexión) | Fuera | El NLB lo reenvía sin leerlo **[fuente]** |
| Capas OSI, «capa 4» y «capa 7» | 7 | AWS las usa para ALB y NLB: el ALB «functions at the application layer, the seventh layer» y el NLB «at the fourth layer» **[fuente]** |
| Algoritmos de reparto, afinidad de sesión (stickiness) | 7 | Es del balanceador |
| WebSocket, SSE, gRPC | 7 y 13 | El ALB lo soporta **[fuente]**. No cambian lo que enseña el 3 |
| Otros códigos: 1xx; 201, 202, 204; 303, 304; 405, 408, 409, 413, 414, 415, 421, 422; 460 a 464 y 561 y 562 (propios del ALB); 507 | Cada uno llega con el servicio que lo genera (7, 9, 13) | La sección 6.1 dice cuáles sí |
| Compresión, `Transfer-Encoding`, `Range` | 9 | Los pide CloudFront. Nada del 3 depende de ellos |
| Cómo se resuelve un nombre con DNS cifrado (DoH, DoT) | Fuera | RFC 9849 §1 los menciona como solución parcial |
| Proxy directo (el cliente lo elige) y túneles | 12 (VPN) | RFC 9110 §3.7 los define. Ningún flujo del 3 los usa |
| CPU, memoria y disco; sistema operativo; kernel | 4 (sistema operativo y kernel, que ya usa `icmp_echo_ignore_all`) y 7 (CPU de Auto Scaling, EBS) | La hoja de capítulos asigna N0.1 al 3, pero la ficha solo retiene «proceso que escucha». Ningún flujo del 3 usa CPU, memoria ni disco. «Sistema operativo» sigue siendo una palabra corriente en el 2 y el 4 |
| Tipos de ataque web: inyección SQL, XSS, CSRF, bots, DDoS | 20 | Ahí es donde se enseñan. El 3 da dónde viaja cada carga: `query string`, cabecera, cookie y cuerpo |
| YAML y HCL | 18 | La ficha del 18 dice «JSON, YAML y HCL» |
| XML | 5 y 9 | Algunas API de AWS responden XML: **[sin verificar]** cuáles |
| OpenAPI | 13 o 18 | Es una forma de describir una API |

---

## 6. Respuestas a las tres preguntas de la ficha

### 6.1 Pregunta 1. ¿Qué códigos de estado deben existir antes de ELB y API Gateway (por ejemplo 403, 502, 503 y 504)?

**Recomendación:** once códigos con nombre propio (200, 301, 400, 401, 403, 404, 429, 500, 502, 503 y 504), las dos clases 4xx y 5xx, y `redirección`, que nombra 302, 307 y 308 dentro de su definición. En términos: `status-code`, `status-200`, `redirect`, `status-301`, `client-error`, `status-400*`, `status-401`, `status-403`, `status-404`, `status-429`, `server-error`, `status-500*`, `status-502`, `status-503`, `status-504` (quince, de los que dos son Apoyo).

**Por qué esos:**

- **Cada uno tiene al menos un servicio de AWS que lo genera con una causa propia.** Ese criterio dejó fuera los códigos que ningún servicio del curso necesita explicar.
- **Los cuatro de la ficha están.** 403, 502, 503 y 504, más 401, 429 y 404, que la ficha no nombra pero que API Gateway, CloudFront y S3 sí.
- **Las dos clases** son lo que miden las métricas del ALB (`HTTPCode_ELB_5XX_Count`, `HTTPCode_Target_4XX_Count`…) **[fuente]**. Las alarmas de despliegue de los capítulos 16 y 19 las usarán [inferencia].

**Quién genera cada código en el curso** [fuente: las páginas citadas en 4.1 y 4.2]:

| Código | Lo generan | Primer capítulo |
|--------|-----------|-----------------|
| 200 | El servidor de origen. El ALB, con una acción de respuesta fija. Es el que busca por defecto el health check | 7 |
| 301 / 302 | El ALB (acción de redirección). 301 y 307 los da CloudFront. El origen | 7 |
| 307 | CloudFront, a los métodos que no son GET ni HEAD | 9 |
| 400 | El ALB (petición mal formada). API Gateway (validación del cuerpo o de los parámetros). Cualquier servidor, si la petición HTTP/1.1 no trae la cabecera Host (RFC 9112 §3.2) | 13 |
| 401 | El ALB (acción de autenticar, o un JWT que falla). API Gateway (`UNAUTHORIZED`) | 13, 20 |
| 403 | AWS WAF en ALB, API Gateway y CloudFront. API Gateway (varias causas). CloudFront (nombre alterno, geografía, URL firmada). S3 (`Access Denied`) | 7, 9, 13, 20 |
| 404 | El origen. API Gateway (`RESOURCE_NOT_FOUND`). S3 (`NoSuchKey`) | 9 |
| 429 | API Gateway (`THROTTLED`, `QUOTA_EXCEEDED`). Un WAF con respuesta propia | 13, 20 |
| 500 | El origen. El ALB (error del WAF o del proveedor de identidad). API Gateway (configuración o authorizer) | 13 |
| 502 | ALB, CloudFront, API Gateway (respuesta de Lambda con otro formato) | 7, 9, 13 |
| 503 | El origen sobrecargado o en mantenimiento. ALB (sin targets registrados o todos «unused»). CloudFront (origen sin capacidad, o el borde). S3 `Slow Down` | 7, 9 |
| 504 | ALB (conexión en 10 s o idle timeout). CloudFront. API Gateway (`INTEGRATION_TIMEOUT`, 29 s por defecto) | 7, 9, 13 |

**Qué no entra, y a dónde va:** 1xx, 201, 202, 204, 303, 304, 405, 408, 409, 413 a 415, 421, 422, 460 a 464, 507, 561 y 562. Cada uno llega con el servicio que lo genera (sección 5).

**Lo que más importa de la tabla:** el código por sí solo no dice dónde nació. Un 403 puede ser del WAF, de API Gateway, de CloudFront o del origen. Un 502 puede ser del ALB o de API Gateway. La ficha lo dice así: «en qué tramo del camino nació». Enseñar el código **junto con quién lo genera** es lo que evita el error de 4.2.

### 6.2 Pregunta 2. ¿Cuánto cifrado exige TLS para entender ACM y KMS, sin abrir criptografía de más?

**Recomendación:** **siete conceptos** y nada de algoritmos. En términos: `encryption`, `symmetric-encryption`, `asymmetric-encryption`, `public-key`, `private-key`, `hash`, `digital-signature`, más `session-key*`, que es el puente entre los dos tipos.

**Cómo salió la lista.** ACM tiene una página de conceptos con 21 entradas **[fuente]**. Las crucé con lo que el 7 pide:

| Entrada de la página de conceptos de ACM | Qué hacer |
|------------------------------------------|-----------|
| Asymmetric Key Cryptography; Symmetric Key Cryptography; Encryption and Decryption | Entran: `cifrado asimétrico`, `cifrado simétrico`, `cifrado` |
| ACM Certificate; SSL Server Certificates; Certificate Authority; Root Certificate; Trust; Wildcard Certificate | Entran: `certificado`, `autoridad certificadora`, `cadena de certificados`, `validación del certificado`, `certificado comodín` |
| Secure HTTPS; Transport Layer Security (TLS); Secure Sockets Layer (SSL); Hypertext Transfer Protocol (HTTP) | Entran: `HTTPS`, `TLS`, `HTTP`. SSL queda dentro de TLS |
| Domain Name System; Domain Names; Fully Qualified Domain Name; Apex Domain | Ya existen (2): `DNS`, `nombre de dominio`. «Apex» y «FQDN» son nombres de ACM y Route 53 (7 y 17) |
| Public Key Infrastructure (PKI); Certificate Transparency Logging; ACME; ACM Root CAs | Fuera: el 7 los lee, el 26 y el 32 los usan |

**Dónde usa TLS 1.3 cada tipo de criptografía.** Esto es lo que evita «abrir de más» [fuente: RFC 8446 §2]:

1. **Acordar la clave:** un intercambio efímero (EC)DHE. No se cifra nada con el certificado.
2. **Probar quién es el servidor:** el servidor **firma** el saludo con la clave privada de su certificado (`CertificateVerify`). El cliente comprueba esa firma con la clave pública que trae el certificado.
3. **Proteger los datos:** una clave simétrica de sesión. Es más rápida que la asimétrica.
4. **Detectar cambios:** un MAC sobre el saludo (`Finished`).

**KMS (capítulo 8).** La ficha dice «AWS KMS» y, en la pregunta, «key policy, cifrado de sobre». La página de claves de KMS habla de claves simétricas de 256 bits y de claves privadas RSA o de curva elíptica **[fuente]**. De los siete conceptos salen las dos familias de claves de KMS, «cifrar y descifrar» y «firmar y comprobar». La política de claves y el cifrado de sobre son del 8.

**Qué dejar fuera, explícitamente:**

- **Nombres de algoritmos** (AES, RSA, ECDSA, SHA-256): solo como etiquetas en la consola de ACM (el 7 las muestra: ACM admite RSA de 2048, 3072 y 4096 bits y ECDSA **[fuente]**).
- **Tamaños de clave, aritmética de Diffie-Hellman, modos de cifrado, relleno.**
- **Suites de cifrado y secreto perfecto hacia adelante** (más allá de «no se cifra con el certificado»).
- **MAC / HMAC** como término. SigV4 lo necesita (5) y lo introduce el 5 con `hash` ya conocido.

**Una trampa:** si el 3 define `firma digital` como «un hash cifrado con la clave privada», parece lo mismo que SigV4 («un hash con una clave secreta»). No lo son: una verifica con la clave **pública**, la otra con la **misma** clave secreta. La definición de la tabla dice «con la clave pública se comprueba». El 5 debe decirlo al revés.

### 6.3 Pregunta 3. ¿Cómo se ve en el mapa un proceso que escucha y uno que no?

El dibujo queda fuera de esta investigación. Esto es lo que hay que poder distinguir, con los términos que ya existen.

**Qué ya existe (capítulo 2).** Servicio, puerto, escuchar, puerto cerrado, RST, Connection refused, puerto filtrado, dirección de escucha, timeout. Un puerto sin servicio contesta RST; uno filtrado calla. Una app ligada a `127.0.0.1` rechaza desde afuera.

**Qué agrega el 3 al proceso que escucha.** Cuatro estados de un servidor web que el cliente ve **distinto**:

| Estado | Lo que ve el cliente | Término |
|--------|---------------------|---------|
| El **proceso no corre** (o no escucha en esa dirección y puerto) | Rechazo inmediato: `Connection refused`. No hay saludo TLS ni código HTTP | `proceso`, `puerto cerrado` (2) |
| El proceso escucha pero un **firewall descarta** | Silencio: timeout | `puerto filtrado` (2) |
| El proceso escucha y habla **otro protocolo** que el cliente | Un error de TLS o `400 The plain HTTP request was sent to HTTPS port` | `https`, `saludo TLS` (4.3) |
| El proceso escucha, completa el saludo y **contesta**, con éxito o con error | Un código de estado, y se puede decir quién lo generó | `código de estado`, `200 OK`, `error 5xx` |

**Lo nuevo de verdad** es la tercera fila: ni «nadie escucha» ni «un firewall calla». El desajuste entre lo que habla el proceso y lo que habla el cliente es un tercer modo de fallo que el 2 no tiene. Lo probé en ambos sentidos [local] (4.3).

**Dos precisiones para no mentir:**

- **Un proceso no es un puerto.** Un mismo proceso puede escuchar en varios puertos (80 y 443). Y varios procesos pueden compartir un puerto con el mismo socket, pero eso es avanzado y no lo usa nada [inferencia].
- **El puerto no decide el protocolo.** Lo decide lo que el proceso hace con la conexión que acepta (4.3).

**La configuración que la ficha pide** (puerto del servidor, regla del firewall, nombre del certificado, redirección a HTTPS) usa términos que ya están: `escuchar`, `regla`, `rango de puertos` (2); `SAN` y `redirección` (esta lista).

---

## 7. Fuentes, pruebas locales y lo que no pude verificar

### 7.1 Fuentes (consultadas el 2026-10-11)

**RFC (copias locales de https://www.rfc-editor.org/rfc/rfcNNNN.txt)**

- RFC 9110, semántica de HTTP. §3.3, §3.6, §3.7, §4.2.1, §4.2.2, §4.2.5, §4.3.4, §7.1, §7.2, §9.2.1, §9.2.2, §11.6.2, §15.4 (301, 302, 307, 308), §15.5.2, §15.5.4, §15.5.20, §15.6.3 a §15.6.5. Obsoleta a RFC 2818 y a 7230–7235.
- RFC 9112, HTTP/1.1. §3.2 (Host), §9.3 y §9.5 (conexiones persistentes y cierres).
- RFC 9113, HTTP/2. §3.1.
- RFC 9114, HTTP/3. §3.1 y §3.1.1.
- RFC 9000 y RFC 9001, QUIC y su uso de TLS 1.3.
- RFC 3986, URI. §3 y §3.5.
- RFC 8446, TLS 1.3. §1.2, §2, §4.4.2.
- RFC 5246, TLS 1.2. Figura 1 y §7.4.7.1.
- RFC 6066, extensiones de TLS. §3 (SNI).
- RFC 9849, TLS Encrypted Client Hello (marzo de 2026). §1.
- RFC 5280, X.509. §4.1.2.5, §4.2.1.6, §6.1.
- RFC 9525, identidad de servicio en TLS (obsoleta al RFC 6125). §1.3, §2, §6.3.
- RFC 6125 (copia local). Solo para ver su estado.
- RFC 6797, HSTS. §7.2, §8.1, §8.3, §8.4, §14.6.
- RFC 8259, JSON. §2, §6.
- RFC 6585, §4 (429).
- RFC 6265, cookies. §1.
- RFC 7568 (SSL 3.0 prohibido) y RFC 8996 (TLS 1.0 y 1.1 en desuso).
- IANA, registro de nombres de servicio y números de puerto (CSV): `https` en 443/tcp, 443/udp y 443/sctp. https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv

**AWS (https://docs.aws.amazon.com/…)**

- ALB: `elasticloadbalancing/latest/application/` → `load-balancer-troubleshooting`, `rule-action-types`, `target-group-health-checks`, `load-balancer-target-groups`, `https-listener-certificates`, `edit-load-balancer-attributes`, `x-forwarded-headers`, `load-balancer-listeners`, `load-balancer-access-logs`, `introduction`.
- NLB: `elasticloadbalancing/latest/network/` → `introduction`, `load-balancer-listeners`.
- ACM: `acm/latest/userguide/` → `acm-concepts`, `acm-overview`, `acm-exportable-certificates`, `acm-limits`, `dns-validation`, `domain-ownership-validation`.
- API Gateway: `apigateway/latest/developerguide/` → `supported-gateway-response-types`, `api-gateway-execution-service-limits-table`, `set-up-lambda-proxy-integrations`, `http-api-jwt-authorizer`, `http-api-vs-rest`.
- CloudFront: `AmazonCloudFront/latest/DeveloperGuide/` → `using-https-viewers-to-cloudfront`, `http-502-bad-gateway`, `http-503-service-unavailable`, `http-504-gateway-timeout`, `http-403-permission-denied`, `adding-response-headers`, `DownloadDistValuesGeneral`, `cnames-and-https-requirements`.
- S3: `AmazonS3/latest/API/API_GetObject`, `AmazonS3/latest/userguide/VirtualHosting`.
- IAM (firma de AWS): `IAM/latest/UserGuide/reference_sigv`, `create-signed-request`.
- KMS: `kms/latest/developerguide/concepts`.
- AWS WAF: `waf/latest/developerguide/waf-rule-statement-fields`.
- Reglas de ejemplo de Security Group: `AWSEC2/latest/UserGuide/security-group-rules-reference`.
- Puntos de enlace de servicio: `general/latest/gr/rande`.
- Blog de seguridad de AWS: «TLS 1.2 to become the minimum TLS protocol level for all AWS API endpoints» (actualizado el 2024-01-17).

**Otras**

- MDN, páginas 401, 403, 502, 504 de HTTP (`developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/…`), `Guides/CORS`, `Reference/Headers/Strict-Transport-Security`, glosario REST.
- Fielding, tesis doctoral, cap. 5 (https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) y «REST APIs must be hypertext-driven» (2008-10-20).
- WHATWG, Fetch Standard §3.3 (https://fetch.spec.whatwg.org/).
- Chrome para desarrolladores, «Deprecations and Removals in Chrome 58».
- Blog de Chromium, «An update on the lock icon» (2023-05-02).
- CA/Browser Forum, aviso de revisión del ballot SC-081v3 (2025-04).
- Node.js: documentación de `http` y de la línea de comandos.

**Qué hice con ellas.** Bajé cada RFC a un directorio nuevo y vacío. Las páginas de AWS, MDN y Node las bajé con `curl` y las pasé a texto con un script en Python (`python3 -I`). Los scripts viven fuera de esos directorios. Las comillas las comparé con ese texto.

### 7.2 Lo que no pude verificar

- **El calendario exacto de la vida de los certificados** (200 días desde el 2026-03-15, 100 desde 2027, 47 en 2029). Leí el aviso de la balota (398 a 47 días, de 2026 a 2029) pero no su PDF; los pasos intermedios son de GlobalSign, ZeroSSL y DigiCert. ACM (198 días) sí es de la fuente.
- **Si ALB y API Gateway hablan HTTP/3.** La página de listeners del ALB no lo menciona; no leí otras.
- **Si el ALB o API Gateway añaden `Strict-Transport-Security`.** No encontré la función.
- **Si el NLB genera códigos HTTP.** Es una inferencia a partir de «cuarta capa».
- **Qué código devuelve API Gateway cuando la Lambda lanza una excepción** (integración proxy). La página solo dice que un formato distinto da 502.
- **Por qué `curl` en macOS acepta una cadena incompleta.** Pudo ser el sistema operativo, una caché o la extensión de acceso a la información de la autoridad. No lo aislé.
- **Qué hacen hoy Node, `curl`, Safari y Firefox con un certificado que solo tiene CN.** Solo leí el caso de Chrome 58, y el dato de Firefox 48 y de los Baseline Requirements es de segunda mano. Los Baseline Requirements no los leí.
- **Cómo se porta un navegador.** Nada de lo que probé fue un navegador: fueron `curl`, Node y `openssl`. Lo de la cadena incompleta, el CN y el candado en un navegador concreto queda sin probar.
- **Cuántos navegadores y servidores soportan ECH hoy.**
- **El estado final de TLS 1.2 como mínimo en todos los endpoints de AWS.** El blog de enero de 2024 decía que el resto terminaría «over the next six weeks».
- **El método que usa `fetch` de Node tras una 301.** Vi que siguió y terminó en 200; no imprimí el método.
- **El formato de respuesta de cada API de AWS (XML o JSON).**
- **Atributos de cookie** (`Secure`, `HttpOnly`, `SameSite`) y la sección de redirecciones del Fetch Standard: no los leí.
- **Cómo usa un cliente de AWS una clave de idempotencia.**
- **La resistencia a la preimagen del hash** («del hash no se recuperan los datos») la doy como conocimiento general; no la contrasté en esta lectura.
- **`trust proxy` de Express.** Lo menciono sin haberlo leído.
- **Que un certificado para `localhost` no lo emite una autoridad pública.** Es una inferencia.
- **Las páginas de AWS** las leí convertidas a texto; alguna tabla puede haber perdido formato.

### 7.3 Pruebas locales (Mac del estudiante, macOS 26.6.2, 2026-10-11)

Solo clientes contra sitios públicos. Ningún servidor.

- **`curl -sS -v --http1.1 https://example.com/`:** TLS 1.3, ALPN `http/1.1`, `subject: CN=example.com`, validez del 2026-09-26 al 2026-12-25 (90 días), `subjectAltName: host "example.com" matched`, `alt-svc: h3=":443"; ma=86400`.
- **`curl -sS -v --http2 https://example.com/`:** ALPN `h2`; pseudo-cabeceras `:method`, `:scheme`, `:authority`, `:path`.
- **`openssl s_client -connect example.com:443 -servername example.com`** y con `-noservername` y con `-servername www.not-example-xyz.test` (4.4). Con el certificado: `openssl x509 -noout -ext subjectAltName,basicConstraints,keyUsage,extendedKeyUsage` mostró `DNS:example.com, DNS:*.example.com`, `CA:FALSE`.
- **`curl -sS -I http://aws.amazon.com/`, `http://github.com/`, `http://en.wikipedia.org/`, `http://docs.aws.amazon.com/`:** todos `301` a `https://`.
- **`curl -i -X POST -d x=1 http://aws.amazon.com/`:** `307 Temporary Redirect`.
- **`curl -L -d x=1` a `http://github.com/` y a `http://aws.amazon.com/`:** método final `GET` (tras la 301) y `POST` (tras la 307), con `%{method}`.
- **`fetch` de Node con `POST` a `http://github.com/`:** `redirect: 'manual'` dio `301`; con redirección siguió y dio `200`.
- **`curl -sS -I https://aws.amazon.com/` y `https://github.com/`:** cabecera `strict-transport-security`.
- **`curl -sS -I https://{expired,wrong.host,self-signed,untrusted-root,incomplete-chain}.badssl.com/`** y `fetch` de Node contra los mismos cinco, y `openssl s_client` contra `incomplete-chain` (4.6).
- **`curl --http1.1 -H 'Host:' http://example.com/`:** `400`. **Con `-H 'Host: not-a-site.invalid'`:** `409`.
- **`curl http://example.com:443/`:** `400 The plain HTTP request was sent to HTTPS port`. **`curl https://example.com:80/`:** `(35) … tlsv1 alert protocol version`. **`fetch('https://example.com:80/')`:** `ERR_SSL_PACKET_LENGTH_TOO_LONG`.
- **`node -e` con `http.createServer()` sin llamar a `listen`:** `keepAliveTimeout` 5000, `headersTimeout` 60000, `requestTimeout` 300000. No abrí ningún puerto.
- **`node -e` con `JSON.parse` y `JSON.stringify`** (4.10).
