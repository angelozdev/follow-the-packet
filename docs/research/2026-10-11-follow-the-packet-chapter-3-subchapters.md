# Capítulo 3, «La web por dentro»: propuesta de subcapítulos

## Decisiones del estudiante (2026-10-11)

- **Base aprobada:** los 17 subcapítulos de la sección 1, en un solo capítulo.
- **D-1 = A:** un capítulo de 17.
- **Aceptadas en bloque, con la recomendación de este documento:**
  - D-2 = B
  - D-3 = A
  - D-4 = A
  - D-5 = A
  - D-7 = A
  - D-8 = A
  - D-9 = A
  - D-10 = B (TLS 1.3 deriva una clave por sentido, RFC 8446 §7.3; confirmarlo en el plan)
  - D-11 = A
  - D-12 = A
  - D-13 = A
  - D-14 = A
  - D-15 = A
  - D-16 = A
  - D-17 = B
  - D-18 = A
- **D-6 = A:** el origen es un dispositivo aparte, `servidor-app`. El estudiante lo eligió por visual y entendible: se ven los dos tramos y dónde nace un 502 o un 504. La variante B (la app en `127.0.0.1:3000` detrás del proxy, en el mismo equipo) va como dato práctico al final de un subcapítulo.

Fecha: 2026-10-11 · Estado: aprobada por el estudiante el 2026-10-11 (17 subcapítulos en un solo capítulo); ver «Decisiones del estudiante». No cambia el juego, el código ni el worktree del capítulo 2.

Parte de la [investigación de conceptos del capítulo 3](2026-10-11-follow-the-packet-chapter-3-concepts.md) (65 términos: 55 Núcleo y 10 Apoyo, grupos A a G), de la [ficha del capítulo 3](2026-10-09-follow-the-packet-chapters.md) y de las fichas de los capítulos 4, 5, 7, 9, 13 y 20. El formato imita el spec del capítulo 2 (en su worktree, `docs/specs/2026-10-11-follow-the-packet-chapter-2-design.md`) y el [spec del capítulo 1 en catorce](../specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md).

Etiquetas de evidencia, las mismas de la investigación: **[fuente]** y **[local]** remiten a la investigación; **[inferencia]** lo deduzco; **[sin verificar]** no lo comprobé. Todo lo nuevo de esta propuesta que no viene de la investigación lleva su etiqueta.

## Resumen

- **Dieciséis subcapítulos con términos y una guardia: 17.** Promedio de 4,06 términos por subcapítulo. El capítulo 2 tuvo 4,08 (53 en 13).
- **Cobertura:** los 65 términos aparecen una sola vez. Ningún subcapítulo baja de 3 ni pasa de 6. Lo comprobó un script (sección 3).
- **Escalera:** 0 choques. Cambian de lugar 18 términos respecto del orden de la investigación. Solo se reescribe una definición: la de `curl`, que sube del 60 al 01.
- **Algo viaja en todos.** No hay excepciones. El cifrado asimétrico viaja como firma, porque en TLS 1.3 la clave privada firma y no descifra.
- **Densos:** ninguno pasa de 6. El 06 llega a 6. El 11 y el 12 traen 5 términos difíciles cada uno. La sección 4 dice por dónde se parten.
- **Decisiones abiertas:** 18 (sección 8). Las dos pedidas: el tamaño (recomiendo **un solo capítulo**) y N0.1 (recomiendo **el capítulo 7**).

## Reglas que sigue la propuesta

1. Una idea por subcapítulo, de 3 a 6 términos.
2. Algo viaja y termina en «llegó» o en «murió por X».
3. Escalera: cada definición usa solo términos de los capítulos 1 y 2, del mismo subcapítulo o de uno anterior.
4. Sin predicciones. Lo que el jugador debe anticipar se pregunta al final, en la explicación a Lucía.
5. Todo cambio de comportamiento de la red tiene su causa contada. El report nombra la pieza que cambió y quién la cambió.
6. El último subcapítulo es una guardia. El primer caso es guiado y uno repara algo.
7. Rigor: se aplican las correcciones de la sección 4 de la investigación (aquí, sección 7).
8. Lenguaje simple y títulos cortos.

---

## 1. Los subcapítulos

`*` marca un término de Apoyo. «Sube» o «baja» dice que el término cambia de lugar respecto del orden de la investigación (sección 3).

| # | Título | Idea | Términos | Qué viaja | Qué hace el jugador | Termina en |
|---|--------|------|----------|-----------|---------------------|------------|
| 01 | Una dirección para cada cosa | Una URL dice con qué protocolo, a qué nombre o IP, a qué puerto y qué recurso se pide. `curl` la pide y muestra lo que contesta | `http` HTTP · `url` URL · `url-path` path · `query-string` query string* · `curl` curl (sube del 60) | Dos peticiones de `laptop-lucia` a su propia app, `curl http://localhost:3000/pedidos?id=7` y `?id=8`, y sus respuestas | Arma la URL con fichas: esquema, nombre, puerto, path y query string | Llegan los dos cuerpos: el pedido 7 y el pedido 8 |
| 02 | Pedir y contestar | La petición lleva un método que dice qué quiere hacer, y la respuesta contesta. Repetir un GET, un PUT o un DELETE deja el mismo efecto; repetir un POST, no | `http-request` petición HTTP · `http-response` respuesta HTTP · `http-method` método HTTP · `idempotent` idempotente | Un GET, dos POST iguales y dos PUT iguales de `laptop-lucia` a su app | Elige el método y el cuerpo con fichas | Los dos POST crearon dos pedidos. Los dos PUT dejaron uno igual |
| 03 | Quién contesta | Contesta un proceso que escucha en un puerto y que el firewall deja alcanzar. Sin proceso hay rechazo; con un firewall que descarta, silencio. Ninguno de los dos es una respuesta HTTP | `process` proceso (baja) · `web-server` servidor web · `browser` navegador | El navegador de `tu-laptop` pide `http://192.168.1.11:3000/`. Después, un `curl` con la app cerrada | Agrega en el firewall de `laptop-lucia` la regla TCP 3000 solo para la oficina | La página llega. Con el proceso detenido, `Connection refused` y ningún código |
| 04 | Un servidor, varios sitios | Varios nombres pueden llevar a la misma IP. La cabecera Host dice qué sitio se pide, y el servidor web elige ese host virtual | `http-header` cabecera HTTP · `host-header` cabecera Host · `virtual-host` host virtual | `curl -i` y el navegador a `www.lucia.example`, a `blog.lucia.example` (alias de `www` desde el 02-11) y a `198.51.100.60`, sin puerto: van al 80 | Agrega el sitio `blog.lucia.example` en la tarjeta «Sitios» de `servidor-nuevo` | Cada nombre recibe su sitio. La IP sola recibe el sitio por defecto |
| 05 | ¿Cómo salió? | Cada respuesta trae un código de tres cifras. La primera da la clase: 2, se cumplió; 4, la petición, tal como llegó, no se puede cumplir | `status-code` código de estado · `status-200` 200 OK · `client-error` error 4xx · `status-404` 404 Not Found (sube) · `status-400` 400 Bad Request* | Tres `curl -i` de `tu-laptop` a la app de Lucía | Elige el path y la query string | 200, 404 y 400 |
| 06 | Quién eres y qué puedes | Autenticar es saber quién pide. Autorizar es decidir qué puede. 401: no sabe quién eres. 403: lo sabe y no te deja | `authentication` autenticación · `authorization` autorización · `authorization-header` cabecera Authorization · `status-401` 401 Unauthorized · `status-403` 403 Forbidden · `cookie` cookie* (sube) | `curl` a `/admin` sin credencial, con la de Marta y con la de Lucía. El navegador inicia sesión y devuelve la cookie | Elige qué credencial manda y por dónde: cabecera o cookie | 401, 403 y 200 |
| 07 | Un servidor delante | Un proxy inverso recibe la petición y la reenvía al servidor de origen por otra conexión. El origen solo ve la IP del proxy, salvo que lea X-Forwarded-For | `reverse-proxy` proxy inverso · `origin-server` servidor de origen · `x-forwarded-for` X-Forwarded-For* · `status-429` 429 Too Many Requests | Peticiones de `tu-laptop` y una ráfaga de `casa-lucia` a `www.lucia.example/pedidos`, de `servidor-nuevo` a `servidor-app` | Configura `servidor-app` para tomar la IP del cliente de X-Forwarded-For | Antes, todos reciben 429. Después, `tu-laptop` recibe 200 y `casa-lucia`, 429 |
| 08 | ¿El origen o el proxy? | Un 5xx dice que el servidor falló. El proxy reenvía tal cual el 500 del origen. Genera su propio 504 si el origen no contesta a tiempo, y su 503 si no tiene a quién reenviar | `server-error` error 5xx · `status-500` 500 Internal Server Error* · `status-503` 503 Service Unavailable · `status-504` 504 Gateway Timeout | Tres `curl -i` por el proxy: a un path que falla en la app, a uno lento y con la lista de orígenes vacía | Lee en la caja quién generó cada código. Vuelve a poner `servidor-app` en la lista de orígenes | 500 de `servidor-app`; 504 y 503 de `servidor-nuevo`. Al final, 200 |
| 09 | Rechazada o cortada | El 502 es del proxy: el origen rechazó la conexión o la cortó. Sale a ratos si el origen cierra una conexión persistente sin uso antes que el proxy | `status-502` 502 Bad Gateway (baja) · `persistent-connection` conexión persistente · `idle-timeout` idle timeout | Un `curl` con la app detenida. Después, dos peticiones separadas por una espera de 10 s en el reloj del juego | Sube el idle timeout de `servidor-app` por encima de los 60 s del proxy | 502 con la app detenida y 502 tras la espera. Con el ajuste, 200 |
| 10 | Lo que ve el camino | Cualquier router del camino puede leer HTTP. HTTPS es HTTP dentro de TLS: el contenido viaja cifrado con una clave que ambos tienen. Las IP, los puertos y el nombre siguen a la vista | `encryption` cifrado · `symmetric-encryption` cifrado simétrico · `tls` TLS (sube) · `https` HTTPS (sube) | El inicio de sesión del 06, ahora contra `www.lucia.example`, por `http://` y por `https://`. La captura de `router-proveedor` | Cambia el esquema de la URL a `https` | La misma respuesta. La captura ya no muestra la credencial ni la cookie |
| 11 | ¿Eres tú? | Cifrar no basta: hay que saber quién contesta. El servidor firma con su clave privada y el cliente lo comprueba con la clave pública del certificado. El certificado es público: copiarlo no sirve | `asymmetric-encryption` cifrado asimétrico · `public-key` clave pública · `private-key` clave privada · `digital-signature` firma digital · `certificate` certificado | `curl https://www.lucia.example` a `servidor-nuevo` y, por una línea del archivo hosts, a `servidor-falso`, que presenta una copia del certificado de Lucía | Compara las dos conexiones y quita la línea del archivo hosts | La primera llega. La del impostor muere en la firma, sin ningún código HTTP |
| 12 | ¿Quién lo firmó? | Una autoridad certificadora firma el certificado tras comprobar que quien lo pide controla el nombre. El cliente sigue la cadena hasta una raíz que ya trae. Si cambia un byte, cambia el hash y la firma deja de valer | `hash` hash (baja) · `certificate-authority` autoridad certificadora · `certificate-chain` cadena de certificados · `self-signed-certificate` certificado autofirmado* · `openssl-s-client` openssl s_client* (sube) | Tres conexiones TLS: a `servidor-nuevo`, y dos del impostor, con un certificado editado y con uno autofirmado | Lee la cadena con `openssl s_client` y la tarjeta «Raíces de confianza» de `tu-laptop` | La de Lucía llega. Las dos del impostor mueren en la validación |
| 13 | ¿Es para este nombre? | El cliente valida tres cosas: el nombre que pidió, en el SAN; la cadena; y las fechas. Un comodín cubre un solo nivel y no cubre el nombre de la zona | `san` SAN (baja) · `wildcard-certificate` certificado comodín (baja) · `certificate-validation` validación del certificado | `curl https://www.lucia.example` y `curl https://lucia.example` con el certificado nuevo de `*.lucia.example` | Agrega `lucia.example` a los nombres del certificado | Los dos nombres validan |
| 14 | El saludo TLS | Antes de los datos va el saludo TLS. El cliente manda el nombre en claro (SNI) para que el servidor elija el certificado. El servidor firma, se acuerda la versión de HTTP y ambos calculan una clave de sesión que nunca viaja | `tls-handshake` saludo TLS · `session-key` clave de sesión* · `sni` SNI · `http-versions` versiones de HTTP* (sube) | `curl -v` a `www.lucia.example` y a `marta.example` (mismo servidor, misma IP), y `curl https://198.51.100.60/` | Manda con nombre y sin nombre | Cada nombre recibe su certificado. Por IP no hay SNI: llega el certificado por defecto y la validación falla |
| 15 | Todos a HTTPS | La redirección a HTTPS va donde termina TLS. El proxy contesta 301 a quien llega por `http://` y el navegador vuelve por `https://`. HSTS le pide no volver a probar `http://` | `tls-termination` terminación de TLS (baja) · `redirect` redirección (baja) · `status-301` 301 Moved Permanently (baja) · `hsts` HSTS* | El navegador a `http://www.lucia.example`. La captura del tramo de `servidor-nuevo` a `servidor-app`. Un `curl -L` con POST | Quita la redirección de la app, la pone en `servidor-nuevo` y agrega HSTS | Sin bucle: 301 y luego 200 por HTTPS. La segunda visita va directo a HTTPS. El POST llegó como GET |
| 16 | Datos para programas | Una API ofrece operaciones a otros programas. Los datos suelen ir en JSON, que no es un objeto de JavaScript. REST es un estilo (recursos en URL, métodos y enlaces), no «JSON por HTTP» | `api` API · `json` JSON · `rest` REST | `curl` a `https://www.lucia.example/api/pedidos/7`, al enlace que trae la respuesta y un POST con un cuerpo mal formado | Elige el cuerpo y sigue el enlace | 200 con JSON. 400 con el cuerpo mal formado |
| 17 | Guardia: «la web no carga» | Diagnosticar con el orden completo: ¿resuelve el nombre?, ¿hay ruta?, ¿contesta el puerto?, ¿completa el saludo TLS?, ¿qué código vuelve?, ¿quién lo generó? | Sin términos nuevos | Lo que el jugador elija | Diagnostica siete casos. En el 2 repara el certificado | Nombra la causa de cada caso |

Cuentas: 5 + 4 + 3 + 3 + 5 + 6 + 4 + 4 + 3 + 4 + 5 + 5 + 3 + 4 + 4 + 3 = **65**, con el 17 sin términos. Apoyo: uno en el 01, el 05, el 06, el 07, el 08 y el 15; dos en el 12 y el 14 (**10**).

**Qué pide la ficha y dónde está.** El puerto y el proceso que escucha: 03. La regla del firewall: 03 (D-14). El nombre del certificado: 13. La redirección a HTTPS: 15. El puerto del servidor del lado del proxy: caso 1 de la guardia.

---

## 2. Bloques sugeridos

El mundo de cada subcapítulo es la solución del anterior. El 03-01 parte del mundo con que termina el 02-14.

### Bloque 1 · Pedir una página (01 a 04)

- **01 · Una dirección para cada cosa.**
  - *Qué cambió:* Lucía terminó su app de pedidos en `laptop-lucia`. La app que en el capítulo 2 solo aceptaba conexiones en el 3000 ahora contesta HTTP. El report lo dice.
  - *Qué hace el jugador:* Lucía la prueba en su propia laptop, por `localhost`. Así el firewall de `laptop-lucia` del 02-05 no estorba: el juego no filtra el loopback (simplificación del capítulo 1).
  - *Qué ve:* `curl` sin opciones imprime solo el cuerpo. Las cabeceras y la línea de estado llegan con `curl -i` en el 04 y el 05, cuando sus términos existen [sin verificar: comportamiento por defecto de `curl`, a leer en su manual de la versión que se imite (D-12)].
  - *Pregunta a Lucía:* «¿Qué parte de la URL eligió el pedido 7?» Correcta: la query string. Incorrectas: el path (elige el recurso, no cuál pedido) y el puerto (elige el servicio).
  - *Rigor:* el mensaje HTTP no es un paquete. Viaja en los datos de la conexión TCP que abrió el saludo de tres pasos del capítulo 2. El fragmento `#…` no llega al servidor (4.14).
- **02 · Pedir y contestar.**
  - *Qué cambió:* Lucía agregó crear y cambiar pedidos.
  - *Pregunta a Lucía:* «Se cortó la red al mandar un POST. ¿Es seguro repetirlo?» Correcta: no, porque POST no es idempotente y puede crear otro pedido. Incorrectas: «sí, la respuesta será la misma» (idempotente habla del efecto, no de la respuesta) y «sí, HTTP evita los duplicados».
  - *Rigor:* idempotente no es lo mismo que seguro ni que «devuelve lo mismo» (4.11).
- **03 · Quién contesta.**
  - Responde a la pregunta 3 de la ficha con tres de los cuatro estados de la investigación (6.3).
  - *Primer intento:* el navegador de `tu-laptop` no recibe nada. El firewall de `laptop-lucia`, visible desde el 02-05, solo deja entrar el 22. El jugador agrega TCP 3000 desde `192.168.1.0/24` y la página llega.
  - *Segundo intento:* Lucía cierra la terminal donde corría su app; el report lo dice. `curl` recibe `Connection refused`.
  - *Pregunta a Lucía:* «Con la app cerrada, ¿por qué `curl` no recibió ningún código?» Correcta: no había proceso escuchando y TCP rechazó la conexión antes de que hubiera HTTP. Incorrectas: «el firewall la descartó» (eso es silencio) y «el servidor web devolvió un error» (no corría ningún servidor web).
  - *Rigor:* un proceso no es un puerto. El puerto no decide el protocolo (6.3).
- **04 · Un servidor, varios sitios.**
  - *Qué cambió:* Lucía instaló un servidor web en `servidor-nuevo` con un solo sitio. Por eso `blog` mostraba la tienda: era el sitio por defecto.
  - *Qué ve:* una URL sin puerto va al 80, el puerto por defecto del capítulo 2.
  - *Pregunta a Lucía:* «`blog` es un alias de `www`. ¿Cómo sabe `servidor-nuevo` qué sitio dar?» Correcta: por la cabecera Host, que lleva el nombre escrito en la URL. Incorrectas: por la IP (es la misma) y por el registro CNAME (el servidor web no ve el DNS).
  - *Rigor:* en HTTP/1.1 la cabecera Host es obligatoria (RFC 9112 §3.2, 4.12). Que viaje el nombre de la URL aunque el DNS haya seguido un CNAME es [inferencia] de RFC 9110 §7.2.

### Bloque 2 · Cómo salió y quién eres (05 y 06)

- **05 · ¿Cómo salió?** La app valida el id («siete» no es un número).
  - *Pregunta a Lucía:* «¿Qué dice la primera cifra de un 404?» Correcta: la clase; la petición, tal como llegó, no se puede cumplir. Incorrectas: «el servidor falló» (esa es la clase 5) y «siempre es culpa del cliente» (lo parece, pero no siempre: 4.14).
- **06 · Quién eres y qué puedes.**
  - *Qué cambió:* Lucía agregó `/admin` con dos usuarios: ella y Marta.
  - *Qué ve:* el navegador guarda la cookie y la devuelve; `curl` no lo hace si no se le pide [sin verificar, D-12]. Lo que une varias peticiones es la cookie: cada petición se entiende sola. El texto no registra «sin estado» (4.13).
  - *Pregunta a Lucía:* «Marta recibió 403. ¿Le sirve repetir con la misma credencial?» Correcta: no; el servidor sabe quién es y no le da permiso. Incorrectas: «sí, el 403 es temporal» y «sí, el 403 dice que su contraseña está mal» (eso es 401).
  - *Rigor (4.1):* los nombres engañan: «Unauthorized» y «Authorization» hablan de autenticación. El takeaway avisa que en AWS el número solo no basta y hay que ver quién lo generó, sin nombrar servicios que aún no existen.

### Bloque 3 · El servidor de delante (07 a 09)

- **07 · Un servidor delante.**
  - *Qué cambió:* Lucía subió su app a `servidor-app` y dejó `servidor-nuevo` delante, como proxy inverso. La app limita las peticiones por IP. `casa-lucia` corre un script que manda muchas.
  - *Qué ve:* el 429 lo genera el origen y el proxy lo reenvía tal cual. Los clientes de la oficina salen todos con la IP pública `203.0.113.10` (NAT del capítulo 2), así que un límite por IP también los junta [inferencia].
  - *Pregunta a Lucía:* «Antes del cambio, ¿por qué `tu-laptop` recibía 429 si mandó una sola petición?» Correcta: el origen veía todas las peticiones con la IP del proxy y las contaba juntas. Incorrectas: «el proxy limita» (el 429 vino del origen) y «`tu-laptop` mandó demasiadas».
  - *Rigor:* el cliente puede escribir su propia X-Forwarded-For. Se confía solo en la que agrega el propio proxy [sin verificar el detalle].
- **08 · ¿El origen o el proxy?**
  - *Qué cambió:* `/informe` tarda más que la espera del proxy. Lucía quitó `servidor-app` de la lista de orígenes para actualizarlo.
  - *Pregunta a Lucía:* «¿Quién generó el 504?» Correcta: `servidor-nuevo`, porque el origen no contestó a tiempo. Incorrectas: `servidor-app` (no llegó a contestar) y `tu-laptop` (un cliente no genera códigos).
  - *Rigor (4.2):* el 503 sale de una lista vacía, el caso que AWS da para el ALB («no registered targets»). El juego **no** enseña «todos los orígenes caídos = 503»: un ALB así falla abierto (capítulo 7). Otros proxies pueden dar otro código [sin verificar].
- **09 · Rechazada o cortada.**
  - *Primer caso:* la app de `servidor-app` terminó; el report lo dice y Lucía la vuelve a arrancar. El proxy recibe un RST y da 502.
  - *Segundo caso:* el proxy reutiliza conexiones hasta 60 s sin datos y `servidor-app` las cierra a los 5 s. Es el caso del desarrollador de Node (4.2): `keepAliveTimeout` de 5000 ms **[fuente]** e idle timeout del ALB de 60 s **[fuente]**. Usa el reloj del juego del capítulo 2.
  - *Pregunta a Lucía:* «¿Por qué el 502 solo salía después de esperar?» Correcta: el origen cerró la conexión sin uso y el proxy la reutilizó. Incorrectas: «la app se cae cada 10 s» (sin espera contestaba) y «el proxy tarda» (eso sería 504).

### Bloque 4 · Cifrar y probar quién eres (10 y 11)

- **10 · Lo que ve el camino.**
  - *Qué cambió:* Lucía activó HTTPS en `servidor-nuevo`.
  - *Quién mira:* `router-proveedor`, porque reenvía todo lo que pasa entre la oficina e internet (D-7).
  - *Pregunta a Lucía:* «Con HTTPS, ¿qué sigue viendo `router-proveedor`?» Correcta: las IP, los puertos y el nombre del sitio. Incorrectas: «nada, HTTPS cifra todo» y «el path y las cabeceras» (van cifrados).
  - *Rigor:* HTTPS es HTTP dentro de TLS y el 443 es costumbre (4.3). La tabla de qué se ve está en 4.4.
- **11 · ¿Eres tú?**
  - *Qué cambió:* un programa que alguien instaló en `tu-laptop` agregó al archivo hosts una línea que manda `www.lucia.example` a `servidor-falso`. El report lo dice.
  - *Qué ve:* el impostor tiene el certificado, que es público, pero no la clave privada. No puede firmar el saludo.
  - *Pregunta a Lucía:* «¿Por qué no le sirvió al impostor copiar el certificado de Lucía?» Correcta: firmar exige la clave privada, y no la tiene. Incorrectas: «el certificado copiado está cifrado» y «la copia cambia el nombre».
  - *Rigor (4.5):* en TLS 1.3 la clave privada firma (`CertificateVerify`) y no descifra nada. El cifrado con la clave pública existe (KMS, capítulo 8), pero el juego no lo muestra viajando dentro de TLS (D-9).

### Bloque 5 · El certificado y el saludo (12 a 14)

- **12 · ¿Quién lo firmó?**
  - *Qué cambió:* el impostor prueba dos cosas más. El report lo dice.
  - *Qué ve:* la autoridad certificadora no es una pieza del mapa. El cliente valida con las raíces que ya trae y no le pregunta nada a la CA [inferencia; la revocación queda fuera, sección 5 de la investigación].
  - *Pregunta a Lucía:* «El certificado autofirmado del impostor decía `www.lucia.example`. ¿Por qué lo rechazó `tu-laptop`?» Correcta: ninguna raíz de confianza de `tu-laptop` lo firmó. Incorrectas: «el nombre no coincide» (coincide) y «no estaba cifrado».
  - *Rigor (4.5, 4.6):* el servidor manda la cadena y puede omitir la raíz. Cada cliente tiene su propia lista de raíces. `NODE_TLS_REJECT_UNAUTHORIZED=0` no es un arreglo.
- **13 · ¿Es para este nombre?**
  - *Qué cambió:* Lucía pidió un certificado comodín y creó el registro A de `lucia.example`. Es un registro A porque el nombre de la zona no admite un CNAME (capítulo 2). Cómo se emite el certificado: D-11.
  - *Pregunta a Lucía:* «¿`*.lucia.example` cubre `lucia.example`?» Correcta: no; un comodín cubre un nivel por debajo, no el nombre de la zona. Incorrectas: «sí, el asterisco cubre todo» y «sí, si el DNS apunta a la misma IP».
  - *Rigor (4.6):* se valida contra el SAN, nunca contra el CN. El error ocurre antes de cualquier código HTTP. Las fechas se dicen aquí y se juegan en el caso 3 de la guardia.
- **14 · El saludo TLS.**
  - *Qué cambió:* Marta aloja `marta.example` en `servidor-nuevo`, con su propio certificado. La zona `marta.example` se agrega a `servidor-autoritativo`. El report lo dice.
  - *Qué ve:* el saludo TLS va después del saludo de tres pasos. `curl -v` muestra la oferta de versiones (`h2`, `http/1.1`) **[local]**.
  - *Rigor:* un nombre que es una IP no viaja en el SNI (RFC 6066 §3, **[fuente]**). El certificado por defecto sin SNI lo documenta AWS para el ALB **[fuente]**. Otros servidores cortan el saludo **[local]** (D-13).
  - *Pregunta a Lucía:* «¿Por qué el nombre viaja en claro en el saludo?» Correcta: el servidor lo necesita para elegir el certificado antes de que exista la clave de sesión. Incorrectas: «es un error de configuración» y «TLS no cifra nada».
  - *Versiones de HTTP:* HTTP/3 va por UDP: una regla que abre TCP 443 no lo abre (4.9). Solo como texto (D-15).

### Bloque 6 · HTTPS para todos y las API (15 y 16)

- **15 · Todos a HTTPS.**
  - *Qué cambió:* Lucía puso en su app de `servidor-app` una redirección a HTTPS para todo lo que llega por `http://`. El report lo dice. Como TLS termina en el proxy, la app ve todo por HTTP y redirige siempre: es un bucle.
  - *Qué hace el jugador:* mueve la redirección al proxy.
  - *Rigor (4.7, 4.8):* la redirección necesita el puerto 80 abierto y escuchando. El POST que llega por `http://` sale como GET tras la 301 **[local]**. El ALB solo hace 301 y 302 **[fuente]**. HSTS solo vale por HTTPS y no cubre la primera visita.
  - *Pregunta a Lucía:* «¿Por qué la app de `servidor-app` no podía hacer la redirección?» Correcta: ve todo por HTTP, porque TLS termina en el proxy, y redirige siempre. Incorrectas: «la app no sabe redirigir» y «HSTS lo impide».
- **16 · Datos para programas.**
  - *Pregunta a Lucía:* «¿Esta API es REST porque devuelve JSON?» Correcta: no; REST es un estilo, con recursos en URL, métodos y enlaces, y JSON es solo un formato. Incorrectas: «sí, REST es JSON por HTTP» y «sí, porque usa GET».
  - *Rigor (4.10):* REST no es «JSON por HTTP». «REST API» y «HTTP API» son nombres de producto de API Gateway y no aparecen hasta el 13. Un cuerpo con comillas simples no es JSON **[local]**.

### Bloque 7 · La guardia (17)

Un solo id, `03-17`, con siete casos. Cada caso es un cambio sobre el mundo del 16 y su report lo dice.

El caso 1 es guiado con el orden de seis preguntas. Las tres primeras son del capítulo 2; las otras tres, de la investigación (sección 2).

| Caso | Causa | Lo que se ve | Opciones incorrectas (el error que reflejan) |
|------|-------|--------------|----------------------------------------------|
| 1 (guiado) | El proceso de la app de `servidor-app` terminó | Resuelve, hay ruta, el 443 contesta y el saludo se completa. Vuelve un 502 generado por `servidor-nuevo`. Un `curl` directo a `servidor-app:3000` da `Connection refused` | «El certificado venció» (el saludo se completó) · «La app falló y dio 500» (un 500 del origen pasa tal cual; este código lo generó el proxy) |
| 2 (repara) | `lucia.example` no está en el SAN del certificado | Falla la validación del nombre y no hay ningún código | «El servidor dio 404» (no hubo código) · «Es autofirmado» (la cadena llega a una raíz) |
| 3 | El certificado de `blog.lucia.example` venció | Falla la validación por fecha | «El nombre no está en el SAN» (coincide) · «El proxy no alcanza el origen» (eso sería un 502, y habría código) |
| 4 | Marta está autenticada y no tiene permiso | 403 en `/admin` | «Su contraseña está mal» (eso sería 401) · «El proxy no tiene a quién reenviar» (eso sería 503) |
| 5 | La app redirige a HTTPS detrás de la terminación de TLS | Demasiadas redirecciones | «El 443 está cerrado» (habría rechazo, no 301 repetidas) · «HSTS bloquea el sitio» (HSTS no redirige) |
| 6 | El origen tarda más que la espera del proxy | 504 | «La app se cayó» (eso sería 502) · «No hay orígenes en la lista» (eso sería 503) |
| 7 | `curl https://192.168.1.11:3000/`: la app habla HTTP sin TLS | Error en el saludo TLS, sin código | «El firewall descarta» (sería silencio) · «Falta la IP en el SAN» (la app no tiene certificado) |

- El caso 7 es el modo de fallo nuevo del capítulo: ni nadie escucha ni un firewall calla; el proceso habla otro protocolo (6.3).
- Casos de reserva, si alguno no cierra: el 429 de todos (07), el 502 a ratos (09), `http://` con el 80 cerrado (necesita D-14 = B) y la cadena incompleta (necesita D-12).

---

## 3. Cobertura

**Cómo lo comprobé.** Un script de Node en el scratchpad de la sesión. No queda en el repo. Hace esto:

1. Lee la tabla de 65 términos de la investigación directamente del Markdown: id, nombre, definición y clase.
2. Lee el registro `src/copy/terms.ts` del worktree del capítulo 2, solo lectura (106 términos). Lee los `introduces` del capítulo 1 (38) y la tabla de 53 del spec del capítulo 2. La resta da los 15 términos que solo son del capítulo 4.
3. Toma la asignación de la sección 1 y la definición reescrita de `curl`.
4. Comprueba la cobertura: cada id una sola vez, ninguno de más, suma 65 y de 3 a 6 por subcapítulo.
5. Comprueba la escalera con la misma expresión de `namedTerms` (`src/levels/ladder.ts`): el nombre entero, sin distinguir mayúsculas, con plural `s` o `es`. Mira cinco cosas:
   - que ninguna definición nombre un término de un subcapítulo posterior;
   - que ninguna nombre un término del capítulo 4;
   - que ninguna definición de los capítulos 1 y 2 nombre un término nuevo;
   - largos de 120 o menos;
   - ids nuevos, no retirados (`server`, `request`, `response`, `linux-ignore-ping`).
6. Repite la escalera con una regla más laxa: cada palabra del nombre en plural y sin tildes («peticiones HTTP», «claves públicas»). `namedTerms` no ve esos plurales, pero un lector sí.
7. Cuenta cuántos términos cambian de lugar como el mínimo: los que quedan fuera de la subsecuencia creciente más larga del orden de la investigación.

**Resultado:**

- 65 términos (55 Núcleo, 10 Apoyo), cada uno una vez. Suma 65. Mínimo 3, máximo 6.
- **0 problemas.** La definición nueva de `curl` mide 105.
- La regla laxa encuentra siete plurales, todos de términos ya conocidos. Un ejemplo: `servidor web` dice «peticiones HTTP» en el 03 y `petición HTTP` es del 02.

**La definición que cambia.**

- **Antes** (60): «Herramienta de consola que hace una petición HTTP y muestra la respuesta. Con -v, también el saludo TLS y las cabeceras.»
- **Ahora** (01): «Una herramienta de consola que pide por HTTP lo que señala una URL y muestra lo que contesta el servidor.» Mide 105.
- **Por qué:** la de antes nombra `petición HTTP` (02) y `saludo TLS` (14). Lo que se pierde («con -v…») va al texto del 04 y del 14.
- **Precedente:** el `nc` del 02-01, que se presentó antes que TCP.

**Los 18 términos que cambian de lugar, por motivo.** El script dice cuántos son, no cuál se mueve en cada par. Agrupados:

| Términos (n.º en la investigación) | Van al | Por qué |
|------------------------------------|--------|---------|
| `curl` (60) | 01 | Lo primero que viaja necesita una herramienta |
| `process` (1) | 03 | Solo se ve junto al servidor web: rechazo frente a respuesta. Su definición solo nombra términos del capítulo 2 |
| `http-header` (10), con `web-server` (11) y `browser` (12) delante | 04 | La primera cabecera con propósito es Host. Es un intercambio entre vecinos |
| `status-404` (26) | 05 | Es el 4xx más común y va con la clase |
| `cookie` (38) | 06 | Es cómo el navegador lleva quién eres tras iniciar sesión |
| `status-429` (27) antes de `server-error` (28) y `status-500` (29); `reverse-proxy` (30), `origin-server` (31) y `x-forwarded-for` (35) juntos | 07 y 08 | El 429 de todos explica para qué sirve X-Forwarded-For. El 08 («¿el origen o el proxy?») necesita el proxy |
| `status-502` (32) | 09 | Va con la conexión persistente y el idle timeout: «rechazada o cortada» |
| `tls` (46) y `https` (57) | 10 | Primero el problema (qué ve el camino) y después cómo funciona |
| `hash` (44) | 12 | Aparece cuando el impostor edita un certificado |
| `openssl-s-client` (61) | 12 | Su definición dice que muestra la cadena |
| `san` (49) y `wildcard-certificate` (50) | 13 | Primero quién firma, después para qué nombre. `certificate-validation` (53) reúne las tres comprobaciones |
| `http-versions` (65) | 14 | La versión se acuerda en el saludo |
| `redirect` (17), `status-301` (18) y `tls-termination` (58) | 15 | La redirección de la ficha es a HTTPS y va donde termina TLS |

---

## 4. Densos

Ninguno pasa de 6 términos. Estos son los candidatos a partirse si la prueba humana los siente pesados:

| Subcapítulo | Por qué es denso | Cómo se parte |
|-------------|------------------|---------------|
| 06 · Quién eres y qué puedes | 6 términos, el tope. Dos vehículos de la identidad: cabecera y cookie | 06a «¿Quién eres?»: `authentication`, `authorization-header`, `cookie`, `status-401`. 06b «¿Qué puedes?»: `authorization`, `status-403` y `status-404`, que baja del 05 como «un 403 que se esconde tras un 404» (RFC 9110 §15.5.4). El 05 queda con 4 |
| 11 · ¿Eres tú? | 5 términos difíciles: el par de claves, la firma y el certificado | 11a «Firmar»: `asymmetric-encryption`, `public-key`, `private-key`, `digital-signature`. El `certificate` pasa al 12, que se parte en dos (fila siguiente) |
| 12 · ¿Quién lo firmó? | 5 términos y dos intentos del impostor | Solo se parte junto con el 11. 12a «Un documento firmado»: `hash`, `certificate`, `certificate-authority`. 12b «¿En quién confías?»: `certificate-chain`, `self-signed-certificate`, `openssl-s-client` |
| 14 · El saludo TLS | Las versiones de HTTP entran de costado | `http-versions` pasa al 10 (el 10 queda con 5) o al 16 (queda con 4) |
| 15 · Todos a HTTPS | La terminación de TLS y la redirección son dos piezas de una misma idea | `tls-termination` pasa al 10 («cifrado hasta donde termina TLS»). El 10 queda con 5 |
| 07 · Un servidor delante | El 429 es un código nuevo dentro de una idea de proxy | El 429 pasa al 05 como ejemplo de 4xx. El 05 queda con 6, y el 07 pierde el motivo de X-Forwarded-For |
| 03 · Quién contesta | Dos envíos con dos causas (firewall y proceso) | No se parte: la regla del firewall es repaso de los capítulos 1 y 2 y no trae términos |

Partir el 11 y el 12 lleva el capítulo a 18. Partir el 06, a 18 o a 19. Separar corre los ids siguientes sin costo: el progreso se puede resetear.

---

## 5. El mapa que crece

Parte del mundo con que termina el 02-14: la solución del 02-13, porque los casos del 14 no se encadenan. Los números exactos se pueden ajustar al escribir los textos. Las IPs de internet siguen RFC 5737 y los nombres van bajo `.example` (decisión D-13 del capítulo 2).

| Pieza | Datos | Aparece en |
|-------|-------|------------|
| El mundo del 02-14 | La oficina de Lucía y `router-oficina` (NAT a `203.0.113.10`); `router-proveedor` y `router-destino`; `servidor-internet` `198.51.100.50`; `servidor-nuevo` `198.51.100.60` (TCP 80 y 443, «solo como números»); `servidor-dns` y `servidor-autoritativo` (`www.lucia.example` A `198.51.100.60`; `blog` alias de `www`); `casa-lucia` `192.0.2.77`; el firewall de `laptop-lucia` del 02-05, que solo deja entrar el 22 desde `tu-laptop` | todos |
| La app de Lucía contesta HTTP | `laptop-lucia`, puerto 3000, `/pedidos?id=` | 01 |
| Crear y cambiar pedidos | La app acepta POST, PUT y DELETE | 02 |
| El navegador de `tu-laptop` | Una tarjeta que muestra la página o el error | 03 |
| Regla TCP 3000 en `laptop-lucia` | La pone el jugador, solo para `192.168.1.0/24` | 03 |
| El proceso de la app se detiene | El report nombra a `laptop-lucia` | 03 |
| Un servidor web en `servidor-nuevo` | Escucha en el 80. La tarjeta «Sitios» empieza con uno (la tienda) y el jugador agrega `blog` | 04 |
| Validación de la app | `/pedidos?id=siete` da 400 | 05 |
| Usuarios y `/admin` | Lucía y Marta. Inicio de sesión con cookie | 06 |
| `servidor-app` y el proxy | `servidor-app` `198.51.100.61` con la app en el 3000. `servidor-nuevo` reenvía `/pedidos`, `/admin` y `/api` a `servidor-app:3000`. Límite por IP en la app. Script de `casa-lucia` | 07 |
| Caminos lentos y rotos; lista de orígenes | `/informe` tarda más que la espera del proxy; `/pedidos/roto` falla; Lucía vacía la lista | 08 |
| Tiempos de las conexiones | Idle timeout del proxy, 60 s; el de `servidor-app`, 5 s. Usa la tarjeta «Reloj del juego» del capítulo 2 | 09 |
| HTTPS en `servidor-nuevo` y la captura | TLS en el 443 con un certificado de `www.lucia.example`. La tarjeta «Lo que ve `router-proveedor`» | 10 |
| `servidor-falso` | `192.0.2.66`, con una copia del certificado de Lucía. Una línea en el archivo hosts de `tu-laptop` | 11 |
| Raíces de confianza de `tu-laptop`; los dos certificados del impostor | La tarjeta de raíces; un certificado editado y uno autofirmado | 12 |
| `lucia.example` sin `www` | Registro A del nombre de la zona a `198.51.100.60`. Certificado `*.lucia.example` con nombres editables | 13 |
| `marta.example` | Zona nueva en `servidor-autoritativo`, sitio en `servidor-nuevo` con su certificado. El certificado por defecto, para quien llega sin nombre | 14 |
| Redirección y HSTS | La redirección empieza en `servidor-app` (bucle) y el jugador la pasa a `servidor-nuevo`. Captura del tramo de `servidor-nuevo` a `servidor-app` | 15 |
| La API | `/api/pedidos` con JSON y un enlace a sus líneas | 16 |
| La guardia | Siete casos, cada uno un cambio sobre el mundo del 16 | 17 |

`router-proveedor` ya está en el mundo desde el capítulo 1. En el 10 se dibuja porque la captura lo nombra. Un router que no se dibuja no se nombra (regla del capítulo 2).

---

## 6. Huecos del motor y de las mecánicas

Sin diseñarlos. Estado de la rama del capítulo 2 en el worktree, HEAD `de3c8b8`, leído el 2026-10-11. El motor del capítulo 2 está hecho hasta la Tarea 13 del plan del 2: puertos, servicios, UDP, rutas, NAT y DNS. El contrato, el reloj de la sesión, la tarjeta «Salida» y la escena aún no. Hoy hay cuatro mecánicas: `filter`, `send`, `identify` y `diagnose`.

| # | Hueco | Hoy | Lo piden |
|---|-------|-----|----------|
| 1 | Un mensaje HTTP dentro de una conexión TCP. La petición lleva método, path, query string, cabeceras y cuerpo; la respuesta, código, cabeceras y cuerpo | `PacketSpec` no tiene contenido. `Trace` no tiene mensaje. TCP solo llega hasta SYN, SYN-ACK, ACK y RST. `reply.ts` solo anota «TCP 80 reply» | 01 a 17 |
| 2 | Qué contesta un servicio web: caminos, métodos, códigos y cuerpos | `Service` es `{protocol, port, listen}`, sin tipo ni comportamiento. El único precedente es `ServerActor.dns` | 01 a 17 |
| 3 | El proceso: un servicio que corre o no; un proceso que escucha en varios puertos | No existe. «Sin servicio» es `closed` | 03, 09, 17 |
| 4 | `curl` como comando, con `-i`, `-v`, `-L`, `-X`, `-d` y `-H`, y su salida como la imprime una versión real | `command` acepta `packet`, `ping` y `traceroute`; un test rechaza `curl`. La tarjeta «Salida» y `src/copy/tools/` están planeadas en el 2 para `nc` y `dig` (Tarea 18) | 01 a 17 |
| 5 | El navegador: muestra la página o el error, sigue redirecciones, guarda cookies, HSTS y la 301 | No existe, ni como actor ni como tarjeta | 03, 04, 06, 15 |
| 6 | Hosts virtuales: el sitio según la cabecera Host, el sitio por defecto y su tarjeta editable | No existe | 04, 14 |
| 7 | Usuarios y permisos por camino: 401 (con `WWW-Authenticate`), 403 y la cookie de sesión | No existe | 06, 17 |
| 8 | Proxy inverso: segunda conexión, lista de orígenes, X-Forwarded-For, reenviar tal cual y generar 502, 503 y 504. La traza dice quién generó cada código | No existe. Ninguna entidad de proxy ni de balanceador | 07 a 09, 15, 17 |
| 9 | Límite por IP (429 con `Retry-After`) y leer la IP de X-Forwarded-For | No existe | 07 |
| 10 | Tiempos: origen lento, espera del proxy, conexión persistente con un idle timeout en cada extremo | El reloj del juego (`wait`) está planeado en el 2 (Tareas 15 y 19). Hoy `timeout` es solo un desenlace, sin duración | 08, 09, 17 |
| 11 | Captura en un router del camino: qué se lee (IP, puertos, el nombre del SNI) y qué no (el contenido) | La VPC tiene un resumen de `tcpdump` (capítulo 4). No hay contenido que mostrar | 10, 15 |
| 12 | El saludo TLS como pasos: ClientHello con SNI y versiones, ServerHello, certificado (cifrado en TLS 1.3), firma, Finished y datos cifrados | No existe | 10 a 15 |
| 13 | Certificados como datos: nombres (SAN y comodín), clave pública, quién lo firmó, fechas, la cadena que se envía, si la firma vale y quién tiene la clave privada | No existe | 11 a 15, 17 |
| 14 | Raíces de confianza de cada cliente, y un cliente que acepta una cadena que otro rechaza | No existe | 12, 17 |
| 15 | Desenlaces de TLS antes de cualquier código HTTP: nombre, cadena, autofirmado, vencido, firma | `OUTCOMES` tiene 10 desenlaces y ninguno es de HTTP ni de TLS. Hay 46 motivos (`Reason`), ninguno web | 11 a 14, 17 |
| 16 | Desajuste de protocolo: TLS a un puerto que habla HTTP y HTTP a uno que habla TLS | No existe | 17 |
| 17 | Terminación de TLS en el proxy, `X-Forwarded-Proto` y el bucle de redirecciones | No existe | 15, 17 |
| 18 | JSON en el cuerpo y su validación (400) | No existe | 16 |
| 19 | Una fecha del juego para las fechas de un certificado | El reloj del 2 cuenta segundos | 13, 17 |
| 20 | Tarjetas editables nuevas: regla de firewall junto a un envío (03), sitios (04), orígenes (08), idle timeout (09), nombres del certificado (13), redirección y HSTS (15) | `filter` coloca reglas. `send` con tablas y ajustes generalizados está planeado en el 2 (`placeEntry`, `setSetting`) | 03 a 15 |
| 21 | Firewall en un servidor de internet, si la regla del 80 se juega en `servidor-nuevo` (D-14 = B) | Los routers y los servidores de internet no tienen firewall. `host-firewall` solo existe en la oficina | 15, 17 |
| 22 | Entidades del mapa: servidor web o proxy, navegador, certificado y captura | `ENTITY_TERMS` no tiene ninguna | todos |
| 23 | Términos: 65 ids nuevos, la prueba que cuenta los ids, la tabla del capítulo 3 en `ladder.test.ts` y la prohibición de temas posteriores en los textos | Registro de 106. `RETIRED_IDS` impide `request`, `response` y `server`: por eso `http-request`, `http-response` y `web-server` | todos |
| 24 | Lección del pensum y nota de concepto, que exige `registry.test.ts` | `syllabus.md` no tiene ninguna lección de HTTP ni de TLS. No hay `concepts/http.md` ni `concepts/tls.md`. Es el pendiente I1 del backlog (D-17) | todos |
| 25 | Desbloqueo: el 04-01 se abre con el último incidente del 3 | Hoy lo abre `CHAPTER_2_DONE` (plan del 2, decidida 18) | 17 |
| 26 | Cambios explicados: los campos nuevos del mundo (sitios, certificados, orígenes, raíces, redirecciones) entran en `changedNames` | Hoy cubre dispositivos, routers y servidores de internet | todos |
| 27 | Prueba espejo: ningún texto da una razón falsa de por qué vuelve la respuesta ni dice «stateful» | Existe para ICMP. El 2 la extiende a TCP y UDP | todos |
| 28 | El test dorado del capítulo 4 no cambia (81 trazas ICMP) | Riesgo, no hueco: los campos nuevos de la traza deben faltar en la VPC | todos |

---

## 7. Correcciones de rigor: dónde se aplican

| Corrección (investigación) | Dónde | Cómo |
|----------------------------|-------|------|
| 4.1 · 401 frente a 403, y AWS no respeta la raya | 06, guardia 4 | El texto separa autenticación y permiso. El takeaway dice que en AWS hay que mirar quién generó el código |
| 4.2 · Quién genera 502, 503 y 504 | 07, 08, 09, guardia 1 y 6 | El 500 y el 429 del origen pasan tal cual. El 502 y el 504 son del proxy. El 503 sale de una lista vacía y no de «todos caídos»: el ALB falla abierto (capítulo 7) |
| 4.3 · HTTPS es HTTP dentro de TLS; el 443 es costumbre | 10, guardia 7 | El caso 7 es el desajuste de protocolo |
| 4.4 · Lo que TLS 1.3 deja visible | 10, 14 | La captura muestra IP, puertos y el nombre; el SNI viaja en claro |
| 4.5 · El certificado es público; la clave privada firma | 11, 12 | El impostor con la copia del certificado no puede firmar |
| 4.6 · El SAN, el comodín, la cadena y las fechas | 12, 13, guardia 2 y 3 | Nunca el CN. Un comodín cubre un nivel |
| 4.7 · 301 frente a 307; la redirección necesita el 80 abierto; el bucle tras la terminación | 15, guardia 5 | El POST que sale como GET; el bucle de la app |
| 4.8 · HSTS | 15 | Solo por HTTPS; no cubre la primera visita; no sustituye la redirección |
| 4.9 · HTTP/3 cabe en pequeño | 14 | Una frase y la regla del TCP 443 |
| 4.10 · REST no es «JSON por HTTP»; JSON no es un objeto de JavaScript | 16 | La pregunta a Lucía |
| 4.11 · Idempotente es del efecto | 02 | La pregunta a Lucía |
| 4.12 · Host y hosts virtuales; los tres lugares del nombre | 04, 14 | DNS (capítulo 2), SNI (14) y Host (04) |
| 4.13 · «Sin estado» | 06 | «Cada petición se entiende sola»; no se registra «stateless» |
| 4.14 · 4xx no siempre es del cliente; el fragmento no viaja | 01, 05 | |
| 4.15 · Palabras que ya significan otra cosa | todos | «path», no «ruta»; «servidor de origen»; «cabecera HTTP», no «encabezado»; «conexión TLS» solo sobre TCP; «clave» siempre con apellido |

---

## 8. Decisiones abiertas

Cada una trae opciones, una recomendación y su porqué. La regla de rigor manda: entre una opción simple y otra que modela la realidad, la segunda. Las opciones inexactas van marcadas.

### D-1. El tamaño del capítulo

- **A. Un capítulo de 17** (16 y la guardia), como la sección 1.
- **B. Dos capítulos.**
  - «3 · La web por dentro» (HTTP): 01 a 09 y 16, más su guardia. Son 11 subcapítulos y 40 términos.
  - «4 · Cifrado y certificados»: 10 a 15, más su guardia. Son 7 subcapítulos y 25 términos.
  - **Renumeración:** el 4 actual («La noche de guardia») pasa a 5, y del 4 al 33 todos suben uno: quedan 34. El nivel 0 pasa a tener cuatro capítulos.
  - **Qué choca con «los capítulos 1 y 4 conservan su número»:**
    - la carpeta `src/levels/04-iaas/` y los ids `04-01` y `04-02`;
    - el test dorado del 4 y sus trazas;
    - `CHAPTERS` y `chapters.test.ts`, que exige que la lista sea igual a la tabla de la hoja de capítulos;
    - la hoja de capítulos, con su mapa, sus fichas y su Mermaid;
    - el desbloqueo del 04-01;
    - los 15 términos registrados «del capítulo 4»;
    - cada «capítulo N» del spec y del plan del 2 (el Security Group stateful del 4, «el 04-01 se abre con el 02-14»);
    - la investigación del 3, que cita los capítulos 4, 5, 7, 9, 13 y 20, que pasarían a ser 5, 6, 8, 10, 14 y 21.
  - El progreso guardado no cuesta nada: se puede resetear.
- **C. Dos partes con el mismo número** («3» y «3b», con ids `03-…` y `03b-…`). Conserva el 4, pero rompe el id de dos cifras y el número entero de `CHAPTERS`.
- **D. Un capítulo con una guardia intermedia** (03-10, «Guardia HTTP»). Son 18.
- **Recomendación: A.**
  1. Conserva el 1 y el 4.
  2. El orden de diagnóstico que el capítulo enseña cruza las dos mitades: el saludo TLS va antes del código, y el código antes de quién lo generó. La ficha pide justo eso en un mismo problema: «un 403, un 502 o un error de certificado». Partirlo separa la guardia en dos.
  3. La densidad es la del 2: 4,06 términos por subcapítulo frente a 4,08.
  4. B obliga a renumerar 30 capítulos y sus textos y tests, sin ganar rigor.
  - **Riesgo:** 45 subcapítulos antes del 04-01 (14 + 14 + 17). Lo atenúan los bloques, la prueba humana al final y los cortes de la sección 4.
  - Ninguna opción es inexacta.

**Decisión del estudiante (2026-10-11):** A. Un capítulo de 17.

### D-2. N0.1: CPU, memoria y disco

N0.1 en la hoja de ruta es «CPU, memoria, disco, procesos y servicios; qué es un servidor». Lo demás ya está repartido: servicio y cliente y servidor (2); proceso, servidor web y servidor de origen (3).

- **A. Al 4.** El tipo de instancia (vCPU y memoria) y el volumen raíz.
- **B. Al 7.** Auto Scaling escala con el uso de CPU; EBS y su zona de disponibilidad; el launch template elige el tipo de instancia.
- **C. Partidos.** CPU y disco en el 7; memoria en el 16, donde se miden métricas.
- **D. Quedan en el 3.** Ningún flujo del 3 los usa: rompe «algo viaja». No es inexacta, pero no cabe.
- **Recomendación: B.** El 7 es el primer capítulo donde algo que viaja depende de ellos: un uso alto de CPU hace nacer instancias, y un volumen EBS no sigue a una instancia a otra zona. En el 4 no viaja nada que dependa de CPU, memoria o disco: sus incidentes son ICMP y el puerto 22. El 4 puede nombrar «tipo de instancia» como nombre de AWS sin definir CPU. Si la memoria va al 16 lo decide la investigación del 7: que EC2 no la mida por defecto está [sin verificar].

**Decisión del estudiante (2026-10-11):** B. Al capítulo 7.

### D-3. `curl` en el 01

- **A.** `curl` en el 01, con la definición reescrita (sección 3).
- **B. El navegador primero.** El navegador se define con «peticiones HTTP», así que el 01 tendría que traer también la petición y la respuesta: 7 términos o más. Además, el navegador esconde la línea de estado y las cabeceras.
- **C. `curl` en su lugar (60).** Hasta el 15 solo viajaría el navegador, sin cabeceras ni códigos a la vista.
- **Recomendación: A.** Repite el precedente del `nc` del 02-01. Ninguna opción es inexacta.

**Decisión del estudiante (2026-10-11):** A. `curl` en el 01, con la definición reescrita.

### D-4. Los 18 cambios de orden

- **A. Aceptarlos** (sección 3). El script da 0 problemas.
- **B. Orden estricto de la investigación,** en bloques seguidos. Sale menos coherente:
  - nada que viaje hasta tener `curl` o el navegador;
  - el proceso solo, sin servidor;
  - la redirección y la 301 antes de que exista HTTPS: la redirección de la ficha (a HTTPS) no se podría enseñar como tal.
- **Recomendación: A.** B no es inexacta; enseña peor.

**Decisión del estudiante (2026-10-11):** A. Aceptar los 18 cambios de orden.

### D-5. Dónde viven la app y el sitio

- **A.** La app de Lucía en `laptop-lucia` (01 a 03, 05 y 06). El sitio en `servidor-nuevo` (04 en adelante), que ya sirve `www.lucia.example` desde el 02-12. La app se muda a `servidor-app` en el 07.
- **B. Todo en un servidor de la oficina,** publicado con un reenvío de puertos, como dice la ficha. **Inexacta con el motor de hoy:** `tu-laptop` llegaría a la IP pública de su propia oficina, y eso pide un NAT de vuelta (hairpin) que el modelo no tiene. Que muchos routers no lo hagan: [sin verificar]. Además, `router-proveedor` no vería ese tráfico y el 10 se queda sin camino.
- **C. Todo en `servidor-nuevo` desde el 01.** Pierde la prueba local, que es lo primero que hace un desarrollador Node, y la regla del firewall con la pieza que ya existe.
- **Recomendación: A.**

**Decisión del estudiante (2026-10-11):** A. La app de Lucía en `laptop-lucia` y el sitio en `servidor-nuevo`; la app se muda a `servidor-app` en el 07.

### D-6. El origen detrás del proxy

- **A. Un dispositivo aparte,** `servidor-app` (`198.51.100.61`).
- **B. El mismo equipo,** con la app en `127.0.0.1:3000` detrás del servidor web. Es la primera publicación típica de una app Node.
- **Recomendación: A.** Se ve la segunda conexión en el mapa. Prepara el 7, donde el balanceador y los destinos son equipos distintos. El 15 necesita un tramo para mostrar la captura en claro después de la terminación. B es exacta; puede ir en un takeaway.

**Decisión del estudiante (2026-10-11):** A. Un dispositivo aparte, `servidor-app`. Lo eligió por visual y entendible: se ven los dos tramos y dónde nace un 502 o un 504. La variante B (la app en `127.0.0.1:3000` detrás del proxy, en el mismo equipo) va como dato práctico al final de un subcapítulo.

### D-7. Quién mira el camino en el 10

- **A. `router-proveedor`,** que reenvía todo lo que entra y sale de la oficina.
- **B. `laptop-visita`, en la misma red local.** **Inexacta:** en una red con switch una laptop no recibe el tráfico de otra sin un ataque que el juego no enseña [inferencia].
- **C. Una Wi-Fi abierta.** Pide enseñar Wi-Fi, que queda fuera.
- **Recomendación: A.**

**Decisión del estudiante (2026-10-11):** A. `router-proveedor`.

### D-8. Cómo llega el impostor (11 y 12)

- **A. Una línea en el archivo hosts de `tu-laptop`,** puesta por un programa. El report dice quién. El archivo hosts es del capítulo 2, y `curl` y el navegador lo leen [inferencia, igual que `ping` en el 02-13].
- **B. Alguien cambia el registro A en `servidor-autoritativo`.** Es exacta, pero afecta a todos los clientes y mezcla DNS con TLS.
- **C. Un impostor en el camino,** entre routers. Pide cambiar rutas.
- **Recomendación: A.** Qué presenta el impostor: en el 11, una copia del certificado de Lucía; en el 12, uno editado con su propia clave pública y uno autofirmado.

**Decisión del estudiante (2026-10-11):** A. Una línea en el archivo hosts de `tu-laptop`.

### D-9. El cifrado asimétrico sin mentir sobre TLS 1.3

- **A.** Lo que viaja es la firma y su comprobación. Cifrar con la clave pública queda en el texto y en las definiciones, y se ve viajar en el 8 (KMS).
- **B.** Mostrar que el cliente cifra la clave de sesión con la clave pública del servidor. **Inexacta para TLS 1.3:** el RFC 8446 §1.2 quitó el intercambio RSA estático **[fuente]**. Era TLS 1.2.
- **C.** Una tarjeta sin viaje («¿quién puede leer esto?»). Sería la tercera excepción a «algo viaja».
- **Recomendación: A.**

**Decisión del estudiante (2026-10-11):** A. Lo que viaja es la firma y su comprobación.

### D-10. La clave de sesión: una o una por sentido

- TLS 1.3 deriva, del mismo secreto compartido, una clave para cada sentido (RFC 8446 §7.3) [sin verificar hoy: no lo leí en esta sesión].
- **A.** Dejar la definición de la investigación y declarar la simplificación.
- **B.** Reescribirla: «La clave simétrica que ambos calculan en el saludo TLS, una por sentido. Cifra los datos y nunca viaja por la red.» Mide 114.
- **Recomendación: B,** si el plan confirma §7.3. Si no, A con la simplificación declarada.

**Decisión del estudiante (2026-10-11):** B. Reescribir la definición con «una por sentido»; confirmar el RFC 8446 §7.3 en el plan.

### D-11. Cómo se emite el certificado nuevo del 13

- **A. Lo da el mundo.** Es una simplificación declarada: la CA comprueba el nombre fuera del mapa.
- **B. El jugador prueba que controla el nombre con un registro DNS.** Con un CNAME, como ACM, que es del capítulo 7. Con un TXT, como ACME, que el capítulo 2 no enseña.
- **Recomendación: A.** La validación por DNS se juega en el 7, con ACM y el CNAME del capítulo 2.

**Decisión del estudiante (2026-10-11):** A. El certificado nuevo lo da el mundo, como simplificación declarada.

### D-12. Qué `curl` y qué `openssl` imita el juego

- **A.** Las versiones de Amazon Linux 2023, como la D-5 del capítulo 2. Cada línea impresa se lee del código de esa versión. Lo que no se verifica no se imprime y la caja lo dice con palabras. Las versiones exactas: [sin verificar].
- **B.** El `curl` de macOS (LibreSSL), el del Mac del estudiante. Se porta distinto: aceptó una cadena incompleta **[local]**.
- **C.** Sin salida literal, solo la caja.
- **Recomendación: A.** Los labs corren en EC2 con Amazon Linux. El 01 dice que en el Mac se ve otra cosa, como el 02-01 con `nc`. Con A, la cadena incompleta queda de reserva hasta saber qué hace el `curl` imitado.

**Decisión del estudiante (2026-10-11):** A. Las versiones de `curl` y `openssl` de Amazon Linux 2023.

### D-13. El proxy del juego

- **A. Genérico, según los RFC.** Donde el RFC deja margen, sigue lo que AWS documenta del ALB: 503 con la lista vacía, certificado por defecto sin SNI e idle timeout de 60 s. Los health checks y el «falla abierto» quedan para el 7.
- **B. Imitar nginx.** Sin orígenes vivos da 502 [sin verificar], y el 7 lo contradiría.
- **Recomendación: A.** Ninguna es inexacta si se declara.

**Decisión del estudiante (2026-10-11):** A. Proxy genérico, según los RFC y lo que AWS documenta del ALB.

### D-14. La regla del firewall que pide la ficha

- **A. En el 03, sobre `laptop-lucia`,** con el firewall de equipo que ya existe. La tensión del 80 (cerrarlo es mínimo privilegio, pero deja sin redirección) va como texto en el 15.
- **B. Un firewall de equipo en los servidores de internet** (hueco 21), para abrir y cerrar el 80 de `servidor-nuevo` en el 15 y en la guardia.
- **C. Dejar las reglas al Security Group del 4.**
- **Recomendación: A ahora, B si la prueba humana lo pide.**

**Decisión del estudiante (2026-10-11):** A. La regla del firewall en el 03, sobre `laptop-lucia` (B solo si la prueba humana lo pide).

### D-15. HTTP/3

- **A. Solo texto:** el término de Apoyo y la regla «TCP 443 no abre UDP 443».
- **B. Modelar QUIC.** La investigación lo deja fuera.
- **Recomendación: A.**

**Decisión del estudiante (2026-10-11):** A. Solo texto.

### D-16. Los casos de la guardia

- **A. Los siete de la sección 2,** con la reparación en el 2.
- **B.** Cambiar alguno por los de reserva.
- **Recomendación: A.** Siete causas distintas que cubren TLS, códigos, quién los generó y el desajuste de protocolo.

**Decisión del estudiante (2026-10-11):** A. Los siete casos de la sección 2, con la reparación en el 2.

### D-17. Lección del pensum y nota de concepto

`registry.test.ts` exige que cada incidente cite una línea de `syllabus.md` y una nota de `concepts/` que exista. El capítulo 3 no tiene lección en el curso.

- **A. Citar la lección más cercana,** como hacen hoy los capítulos 1 y 2 (pendiente I1).
- **B. Volver opcional la lección** para los capítulos con `modules: []`.
- **C. Agregar lecciones a `syllabus.md`.** **Inexacta:** `syllabus.md` es el temario del curso y el curso no las tiene.
- **Recomendación: B, y cerrar el pendiente I1 antes del contenido.** La nota `concepts/http.md` o `concepts/tls.md` nace cuando el estudiante verifique el tema, como manda CLAUDE.md. No se crea solo para un test.

**Decisión del estudiante (2026-10-11):** B. Volver opcional la lección para los capítulos con `modules: []` y cerrar el pendiente I1 antes del contenido.

### D-18. Partir ahora los densos

- **A. Construir los 17** y partir solo si la prueba humana del capítulo entero lo pide, como la D-17 del capítulo 2.
- **B. Partir ya el 06, el 11 y el 12.** Serían 20.
- **Recomendación: A.**

**Decisión del estudiante (2026-10-11):** A. Construir los 17 y partir solo si la prueba humana lo pide.

---

## 9. Sin verificar en esta propuesta

Lo que la investigación ya dejó sin verificar sigue igual (su sección 7.2). Lo nuevo:

- Que `curl` sin opciones imprima solo el cuerpo y no guarde cookies si no se le pide. Es conocimiento general: el plan lo lee en el manual de la versión que se imite.
- La clave por sentido de TLS 1.3 (RFC 8446 §7.3). No la leí hoy.
- El texto exacto de los errores de `curl` en cuatro casos: un impostor sin clave privada, TLS a un puerto que habla HTTP, demasiadas redirecciones y una cadena incompleta con OpenSSL en Linux.
- Qué código da nginx sin orígenes vivos.
- Que EC2 no mida la memoria por defecto.
- Que muchos routers no hagan NAT de vuelta (hairpin).
- Cómo se confía en X-Forwarded-For: qué entrada se toma cuando hay varias.
- Que una laptop en una red con switch no reciba el tráfico de otra. Es [inferencia].
