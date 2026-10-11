# Sigue el paquete: capítulo 3 «La web por dentro» en diecisiete subcapítulos

Fecha: 2026-10-11 · Estado: los 17 subcapítulos, sus 65 términos y su reparto en bloques los aprobó el estudiante antes de escribir este documento. Las decisiones D-1 a D-18 las contestó el estudiante el 2026-10-11 en la [propuesta de subcapítulos](../research/2026-10-11-follow-the-packet-chapter-3-subchapters.md). Este spec y su plan abrieron ocho decisiones nuevas (D-19 a D-26) y nueve visuales (V20 a V28); el estudiante las contestó todas el 2026-10-11 y están en «Decisiones abiertas». Plan de implementación: [`docs/plans/2026-10-11-follow-the-packet-chapter-3.md`](../plans/2026-10-11-follow-the-packet-chapter-3.md).

Desarrolla la ficha del capítulo 3 de la [hoja de capítulos](../research/2026-10-09-follow-the-packet-chapters.md) (líneas 79 a 85), con la [investigación de conceptos](../research/2026-10-11-follow-the-packet-chapter-3-concepts.md): 65 términos (55 de núcleo y 10 de apoyo), correcciones de rigor y fuentes. La ficha pide leer una petición HTTP y su respuesta y saber qué protege TLS. La pregunta de fondo es esta: un desarrollador ve un 403, un 502 o un error de certificado y necesita saber en qué tramo del camino nació.

El capítulo sigue siendo de nivel 0 («Bases»), con el número 3, el título «La web por dentro» y la carpeta `src/levels/03-the-web-inside/`. Se implementa **encima del capítulo 2 terminado**. Hoy ese capítulo está a medias en su worktree (`/Users/angelozdev/me/aws-commit-academy-chapter-2/`, rama `feat/chapter-2`): las Tareas 0 a 14 de su plan están hechas y las demás no. De los specs anteriores sigue valiendo todo lo que declaran vigente el [spec del capítulo 1 en catorce](2026-10-10-follow-the-packet-chapter-1-fourteen-design.md) y el [spec del capítulo 2](2026-10-11-follow-the-packet-chapter-2-design.md): el catálogo de entidades, el modelo genérico, las mecánicas `send`, `filter`, `identify` y `diagnose`, la escalera de términos, el progreso y el desbloqueo, y las reglas de copia.

## Por qué diecisiete

- **La investigación contó 65 términos.** El capítulo 2 presentó 53 en 14 subcapítulos (4,08 por subcapítulo). Este presenta 65 en 17, de los cuales 16 traen términos y uno es la guardia: 4,06 por subcapítulo con términos. Ninguno baja de 3 ni pasa de 6.
- **El orden de diagnóstico cruza las dos mitades.** El saludo TLS va antes del código de estado, y el código antes de quién lo generó. La ficha pide justo eso en un mismo problema: «un 403, un 502 o un error de certificado». Partir el capítulo en dos separaría la guardia en dos (D-1 = A).
- **Mantiene los números.** Los capítulos 1 y 4 conservan su número, sus carpetas y sus ids. Un capítulo más obligaría a renumerar 30 capítulos y sus tests.
- **Cada subcapítulo es una sola idea** y termina en una pregunta a Lucía. Los más densos son el 06 (seis términos), el 11 y el 12 (cinco términos difíciles cada uno). La sección «Riesgos» dice por dónde se parten si la prueba humana del capítulo entero los siente pesados (D-18 = A).
- **Antes de pisar el capítulo 4 el jugador habrá pasado por 45 subcapítulos** (14 + 14 + 17). Lo atenúan los bloques, una sola prueba humana al final y los cortes de la sección «Riesgos».

## Reglas de cada subcapítulo

1. Trae una idea nueva, de 3 a 6 términos.
2. Algo viaja y termina en «llegó» o en «murió por X». No hay excepciones en este capítulo. Lo que viaja es un mensaje HTTP dentro de una conexión TCP, un saludo TLS, una firma o una captura. El mensaje HTTP **no es un paquete**: viaja en los datos de la conexión TCP que abrió el saludo de tres pasos del capítulo 2.
3. Solo usa términos de los capítulos 1 y 2, del mismo subcapítulo o de uno anterior. El texto de una pieza, de una ficha, de un motivo y de un sello cuenta como texto. Una excepción declarada: la salida literal de `curl` y de `openssl s_client`, que imprime lo que imprime la herramienta (D-12 = A) y que un test fija línea por línea con su fuente.
4. Una sola pregunta de explicación por incidente, atómica, con tres opciones y una correcta. Cada incorrecta refleja un error real. La correcta cambia de lugar entre incidentes.
5. No hay predicciones antes de actuar. Lo que un subcapítulo quiere que el jugador anticipe se pregunta al final, en la explicación a Lucía.
6. Nunca un comportamiento distinto de la red sin decirle al jugador por qué (`.claude/rules/explained-behavior-changes.md`). Cada cambio nombra el dispositivo, el servidor o el programa cuya configuración cambió. Lo vigila `src/levels/explained-changes.test.ts`, que el capítulo amplía a procesos, sitios, orígenes, certificados y redirecciones.
7. Rigor siempre. Entre una opción simple y otra que modela la realidad se elige la que modela la realidad, y la otra se marca como inexacta. Toda cifra o comportamiento lleva fuente y fecha. Lo que no se pudo verificar se dice o no se imprime.
8. Lenguaje simple: frases cortas, una idea por frase, títulos cortos. Los nombres de AWS no se adelantan: ningún texto del capítulo nombra un servicio de AWS que el jugador aún no conoce.
9. Un código de estado, un resultado del navegador y la salida de una herramienta **no se dicen con `Message`**. `Message` es para los avisos y los errores del juego; lo que dice la red o una herramienta va como texto de la tarjeta, como en el capítulo 2.

## Decisiones del estudiante

Las tomó el estudiante el 2026-10-11 en la propuesta de subcapítulos. Este documento no las cambia.

| Decisión | Elección | Qué significa para el capítulo |
|----------|----------|--------------------------------|
| D-1 | A | Un solo capítulo de 17 subcapítulos (16 con términos y una guardia) |
| D-2 | B | N0.1 (CPU, memoria y disco) va al capítulo 7. El 3 no los enseña |
| D-3 | A | `curl` abre el 01, con la definición reescrita |
| D-4 | A | Los 18 cambios de orden respecto de la investigación |
| D-5 | A | La app de Lucía vive en `laptop-lucia` (01 a 03, 05 y 06) y el sitio en `servidor-nuevo` (04 en adelante). La app se muda a `servidor-app` en el 07 |
| D-6 | A | El origen es un dispositivo aparte, `servidor-app`: se ven los dos tramos y dónde nace un 502 o un 504. La variante B (la app en `127.0.0.1:3000` detrás del proxy, en el mismo equipo) va como dato práctico al final de un subcapítulo (el 07) |
| D-7 | A | Quien mira el camino en el 10 es `router-proveedor` |
| D-8 | A | El impostor llega por una línea en el archivo hosts de `tu-laptop` |
| D-9 | A | Lo que viaja en el 11 es la firma y su comprobación. Cifrar con la clave pública no viaja dentro de TLS |
| D-10 | B | La clave de sesión es una por sentido. **Confirmado en el RFC 8446 el 2026-10-11**: §7.1 deriva `client_application_traffic_secret_0` y `server_application_traffic_secret_0` del mismo Master Secret, y §7.3 deriva `[sender]_write_key` de la clave de quien envía. La definición de `session-key` dice «una por sentido» (114 caracteres) |
| D-11 | A | El certificado nuevo del 13 lo da el mundo, como simplificación declarada: la autoridad comprueba el nombre fuera del mapa |
| D-12 | A | `curl` y `openssl` imitan las versiones de Amazon Linux 2023. Qué versiones y qué líneas se leyeron, en «Base de investigación» |
| D-13 | A | El proxy del juego es genérico, según los RFC. Donde el RFC deja margen, sigue lo que AWS documenta del ALB: 503 con la lista vacía, certificado por defecto sin SNI e idle timeout de 60 s |
| D-14 | A | La regla del firewall va en el 03, sobre `laptop-lucia`. La tensión del puerto 80 va como texto en el 15 |
| D-15 | A | HTTP/3 solo como texto: el término de apoyo y la regla «TCP 443 no abre UDP 443» |
| D-16 | A | Los siete casos de la guardia, con la reparación en el caso 2 |
| D-17 | B | La lección del pensum es opcional para los capítulos con `modules: []`. Se cierra el pendiente I1 antes del contenido |
| D-18 | A | Se construyen los 17; se parte un denso solo si la prueba humana lo pide |

Reglas que el estudiante dio para todo el juego y que este capítulo aplica:

- **Rigor siempre.** «Mantengamos la rigurosidad SIEMPRE» (2026-10-10). Ninguna opción, texto o ficha enseña algo inexacto aunque sea más simple.
- **Ningún cambio de comportamiento sin causa.**
- **Sin predicciones antes de actuar.** Las comprobaciones de razonamiento van en la pregunta final a Lucía.
- **Una sola primitiva de interfaz por familia.** Una elección visual nueva es una variante de una primitiva que existe. Una primitiva nueva se justifica por escrito. **Este capítulo suma una:** la sección que se pliega (V27 = D), justificada en `DESIGN.md` como una primitiva para toda la familia. Su implementación la elige la Tarea 23 del plan (Radix Accordion recomendado, que sumaría `@radix-ui/react-accordion` en una versión exacta publicada hace al menos dos semanas; `details` y `summary` nativos como alternativa). La tarjeta de captura (V25 = A2) usa `Card` y una lista de campo y valor; la Tarea 26 confirma que no es una primitiva nueva. Fuera de eso, el capítulo no suma primitivas ni dependencias.
- **El progreso guardado se puede resetear; sin migraciones.** Los ids `03-01` a `03-17` son nuevos, así que el capítulo no resetea nada.
- **Elecciones visuales con prototipos HTML renderizados**, nunca con dibujos de texto. La Tarea 0 del plan los prepara, numerados desde V20.
- **Una sola prueba humana, al final del capítulo**, como en los capítulos 1 y 2. Entre bloques lee los textos un revisor `sonnet`.
- **La terminal muestra la sintaxis de Linux** (D-10 del capítulo 1).
- **Direcciones y nombres de documentación:** IPs de RFC 5737 y nombres bajo `.example` (D-13 del capítulo 2).

## El mapa que crece

El mundo del 03-01 es el que deja la solución del 02-14. Los casos del 02-14 no se encadenan, así que el capítulo parte del mundo del 02-13 más lo que el 02-14 deje fijo; el plan lo comprueba en su primera tarea. El capítulo 2 ya generaliza `worldBeforeChanges` para partir de la solución del último incidente del capítulo anterior (decidida 1 de su plan), y el 03-01 se apoya en eso. Los números exactos pueden ajustarse al escribir los textos.

| Pieza | Datos | Aparece en |
|-------|-------|------------|
| El mundo del 02-14 | La oficina de Lucía y `router-oficina` (NAT a `203.0.113.10`); `router-proveedor` y `router-destino`; `servidor-internet` `198.51.100.50`; `servidor-nuevo` `198.51.100.60` (TCP 80 y 443 «solo como números»); `servidor-dns` y `servidor-autoritativo` (`www.lucia.example` A `198.51.100.60`; `blog` alias de `www`); `casa-lucia` `192.0.2.77`; el firewall de `laptop-lucia`, que en el 02-05 solo deja entrar el 22 desde `tu-laptop` | todos |
| La app de Lucía contesta HTTP | Un proceso en `laptop-lucia`, puerto 3000, caminos `/pedidos?id=` | 01 |
| Crear y cambiar pedidos | La app acepta POST, PUT y DELETE y guarda sus pedidos mientras dura la sesión | 02 |
| El navegador de `tu-laptop` | Un programa de `tu-laptop` (no una pieza del mapa) que muestra la página o el error | 03 |
| Regla TCP 3000 en `laptop-lucia` | La pone el jugador, solo para `192.168.1.0/24` | 03 |
| El proceso de la app se detiene | El report nombra a `laptop-lucia` | 03 |
| Un servidor web en `servidor-nuevo` | Escucha en el 80. La tarjeta «Sitios» empieza con uno (la tienda) y el jugador agrega `blog` | 04 |
| Validación de la app | `/pedidos?id=siete` da 400 | 05 |
| Usuarios y `/admin` | Lucía y Marta. Inicio de sesión con cookie | 06 |
| `servidor-app` y el proxy | `servidor-app` `198.51.100.61` con la app en el 3000. `servidor-nuevo` reenvía `/pedidos`, `/admin` y `/api` a `servidor-app:3000`. Límite por IP en la app. La ráfaga de `casa-lucia` | 07 |
| Caminos lentos y rotos; lista de orígenes | `/informe` tarda más que la espera del proxy; `/pedidos/roto` falla; Lucía vacía la lista | 08 |
| Tiempos de las conexiones | Idle timeout del proxy, 60 s; el de `servidor-app`, 5 s. Usa la tarjeta «Reloj del juego» del capítulo 2 | 09 |
| HTTPS en `servidor-nuevo` y la captura | TLS en el 443 con un certificado de `www.lucia.example`. La tarjeta «Lo que ve router-proveedor» | 10 |
| `servidor-falso` | `192.0.2.66`, un programa a medida con una copia del certificado de Lucía. Una línea en el archivo hosts de `tu-laptop` | 11 |
| Raíces de confianza de `tu-laptop`; los dos certificados del impostor | La tarjeta de raíces; un certificado editado y uno autofirmado | 12 |
| `lucia.example` sin `www` | Registro A del nombre de la zona a `198.51.100.60`. El jugador pide un certificado nuevo con otros nombres | 13 |
| `marta.example` | Zona nueva en `servidor-autoritativo`, sitio en `servidor-nuevo` con su certificado. El certificado por defecto, para quien llega sin nombre | 14 |
| Redirección y HSTS | La redirección empieza en `servidor-app` (bucle) y el jugador la pasa a `servidor-nuevo`. Captura del tramo de `servidor-nuevo` a `servidor-app` | 15 |
| La API | `/api/pedidos` con JSON y un enlace a sus líneas | 16 |
| La guardia | Siete casos, cada uno un cambio sobre el mundo del 16 | 17 |

`router-proveedor` ya está en el mundo desde el capítulo 1. En el 10 se dibuja porque la captura lo nombra: un router que no se dibuja no se nombra. Las IPs de internet siguen RFC 5737 (`192.0.2.0/24`, `198.51.100.0/24` y `203.0.113.0/24`) y los nombres van bajo `.example` (RFC 2606 §2). `marta.example` es un nombre nuevo bajo `.example`.

## Los diecisiete

`*` marca un término de apoyo. Las fichas completas (mundo, tareas, pregunta y pistas) están en el plan.

| # | Título | Idea nueva | Términos nuevos | Qué viaja | Termina en |
|---|--------|------------|-----------------|-----------|------------|
| 01 | Una dirección para cada cosa | Una URL dice con qué protocolo, a qué nombre o IP, a qué puerto y qué recurso se pide. `curl` la pide y muestra lo que contesta | HTTP · URL · path · query string* · curl | Dos `curl` de `laptop-lucia` a su propia app, `http://localhost:3000/pedidos?id=7` y `?id=8` | Llegan los dos cuerpos: el pedido 7 y el pedido 8 |
| 02 | Pedir y contestar | La petición lleva un método y la respuesta contesta. Repetir un GET, un PUT o un DELETE deja el mismo efecto; repetir un POST, no | petición HTTP · respuesta HTTP · método HTTP · idempotente | Un GET, dos POST iguales y dos PUT iguales de `laptop-lucia` a su app | Los dos POST crearon dos pedidos. Los dos PUT dejaron uno igual |
| 03 | Quién contesta | Contesta un proceso que escucha en un puerto y que el firewall deja alcanzar. Sin proceso hay rechazo; con un firewall que descarta, silencio. Ninguno de los dos es una respuesta HTTP | proceso · servidor web · navegador | El navegador de `tu-laptop` pide `http://192.168.1.11:3000/`. Después, un `curl` con la app cerrada | La página llega. Con el proceso detenido, `Connection refused` y ningún código |
| 04 | Un servidor, varios sitios | Varios nombres pueden llevar a la misma IP. La cabecera Host dice qué sitio se pide y el servidor web elige ese host virtual | cabecera HTTP · cabecera Host · host virtual | `curl -i` y el navegador a `www.lucia.example`, a `blog.lucia.example` (alias de `www` desde el 02-11) y a `198.51.100.60`, sin puerto: van al 80 | Cada nombre recibe su sitio. La IP sola recibe el sitio por defecto |
| 05 | ¿Cómo salió? | Cada respuesta trae un código de tres cifras. La primera da la clase: 2, se cumplió; 4, la petición, tal como llegó, no se puede cumplir | código de estado · 200 OK · error 4xx · 404 Not Found · 400 Bad Request* | Tres `curl -i` de `tu-laptop` a la app de Lucía | 200, 404 y 400 |
| 06 | Quién eres y qué puedes | Autenticar es saber quién pide. Autorizar es decidir qué puede. 401: no sabe quién eres. 403: lo sabe y no te deja | autenticación · autorización · cabecera Authorization · 401 Unauthorized · 403 Forbidden · cookie* | `curl` a `/admin` sin credencial, con la de Marta y con la de Lucía. El navegador inicia sesión y devuelve la cookie | 401, 403 y 200 |
| 07 | Un servidor delante | Un proxy inverso recibe la petición y la reenvía al servidor de origen por otra conexión. El origen solo ve la IP del proxy, salvo que lea X-Forwarded-For | proxy inverso · servidor de origen · X-Forwarded-For* · 429 Too Many Requests | Una ráfaga de `casa-lucia` y una petición de `tu-laptop` a `www.lucia.example/pedidos`, de `servidor-nuevo` a `servidor-app` | Antes, todos reciben 429. Después, `tu-laptop` recibe 200 y `casa-lucia`, 429 |
| 08 | ¿El origen o el proxy? | Un 5xx dice que el servidor falló. El proxy reenvía tal cual el 500 del origen. Genera su propio 504 si el origen no contesta a tiempo y su 503 si no tiene a quién reenviar | error 5xx · 500 Internal Server Error* · 503 Service Unavailable · 504 Gateway Timeout | Tres `curl -i` por el proxy: a un path que falla en la app, a uno lento y con la lista de orígenes vacía | 500 de `servidor-app`; 504 y 503 de `servidor-nuevo`. Al final, 200 |
| 09 | Rechazada o cortada | El 502 es del proxy: el origen rechazó la conexión o la cortó. Sale a ratos si el origen cierra una conexión persistente sin uso justo cuando el proxy la usa | 502 Bad Gateway · conexión persistente · idle timeout | Un `curl` con la app detenida. Después, dos peticiones separadas por una espera en el reloj del juego (**depende de D-19**) | 502 con la app detenida y 502 en el cruce. Con el ajuste, 200 |
| 10 | Lo que ve el camino | Cualquier router del camino puede leer HTTP. HTTPS es HTTP dentro de TLS: el contenido viaja cifrado con una clave que ambos tienen. Las IP, los puertos y el nombre siguen a la vista | cifrado · cifrado simétrico · TLS · HTTPS | El inicio de sesión del 06 contra `www.lucia.example`, por `http://` y por `https://`. La captura de `router-proveedor` | La misma respuesta. La captura ya no muestra la credencial ni la cookie |
| 11 | ¿Eres tú? | Cifrar no basta: hay que saber quién contesta. El servidor firma con su clave privada y el cliente lo comprueba con la clave pública del certificado. El certificado es público: copiarlo no sirve | cifrado asimétrico · clave pública · clave privada · firma digital · certificado | `curl https://www.lucia.example` a `servidor-nuevo` y, por una línea del archivo hosts, a `servidor-falso`, que presenta una copia del certificado de Lucía | La primera llega. La del impostor muere en la firma, sin ningún código HTTP |
| 12 | ¿Quién lo firmó? | Una autoridad certificadora firma el certificado tras comprobar que quien lo pide controla el nombre. El cliente sigue la cadena hasta una raíz que ya trae. Si cambia un byte, cambia el hash y la firma deja de valer | hash · autoridad certificadora · cadena de certificados · certificado autofirmado* · openssl s_client* | Tres conexiones TLS: a `servidor-nuevo` y dos del impostor, con un certificado editado y con uno autofirmado | La de Lucía llega. Las dos del impostor mueren en la validación |
| 13 | ¿Es para este nombre? | El cliente valida tres cosas: el nombre que pidió, en el SAN; la cadena; y las fechas. Un comodín cubre un solo nivel y no cubre el nombre de la zona | SAN · certificado comodín · validación del certificado | `curl https://www.lucia.example` y `curl https://lucia.example` con el certificado nuevo de `*.lucia.example` | Los dos nombres validan (**el certificado se pide, no se edita: D-21**) |
| 14 | El saludo TLS | Antes de los datos va el saludo TLS. El cliente manda el nombre en claro (SNI) para que el servidor elija el certificado. El servidor firma, se acuerda la versión de HTTP y ambos calculan una clave de sesión por sentido que nunca viaja | saludo TLS · clave de sesión* · SNI · versiones de HTTP* | `curl -v` a `www.lucia.example` y a `marta.example` (mismo servidor, misma IP), y `curl https://198.51.100.60/` | Cada nombre recibe su certificado. Por IP no hay SNI: llega el certificado por defecto y la validación falla |
| 15 | Todos a HTTPS | La redirección a HTTPS va donde termina TLS. El proxy contesta 301 a quien llega por `http://` y el navegador vuelve por `https://`. HSTS le pide no volver a probar `http://` | terminación de TLS · redirección · 301 Moved Permanently · HSTS* | El navegador a `http://www.lucia.example`. La captura del tramo de `servidor-nuevo` a `servidor-app`. Un `curl -L -d` | Sin bucle: 301 y luego 200 por HTTPS. La segunda visita va directo a HTTPS. El POST llegó como GET |
| 16 | Datos para programas | Una API ofrece operaciones a otros programas. Los datos suelen ir en JSON, que no es un objeto de JavaScript. REST es un estilo, no «JSON por HTTP» | API · JSON · REST | `curl` a `https://www.lucia.example/api/pedidos/7`, al enlace que trae la respuesta y un POST con un cuerpo mal formado | 200 con JSON. 400 con el cuerpo mal formado |
| 17 | Guardia: «la web no carga» | Diagnosticar con el orden completo: ¿resuelve el nombre?, ¿hay ruta?, ¿contesta el puerto?, ¿completa el saludo TLS?, ¿qué código vuelve?, ¿quién lo generó? | ninguno | Lo que el jugador elija | Nombra la causa de cada caso |

Cuentas: 5 + 4 + 3 + 3 + 5 + 6 + 4 + 4 + 3 + 4 + 5 + 5 + 3 + 4 + 4 + 3 = **65**, con el 17 sin términos. Apoyo: uno en el 01, el 05, el 06, el 07, el 08 y el 15; dos en el 12 y el 14 (10).

### Los siete bloques

- **Bloque 1 · Pedir una página (01 a 04).** Una URL, un mensaje de ida y uno de vuelta, quién contesta y cómo un servidor sirve varios sitios.
- **Bloque 2 · Cómo salió y quién eres (05 y 06).** Los códigos y la diferencia entre no saber quién eres y no dejarte pasar.
- **Bloque 3 · El servidor de delante (07 a 09).** El proxy inverso, quién genera cada 5xx y el 502 de la conexión persistente.
- **Bloque 4 · Cifrar y probar quién eres (10 y 11).** Qué ve el camino y por qué copiar un certificado no sirve.
- **Bloque 5 · El certificado y el saludo (12 a 14).** Cadena, nombre y fechas, y el saludo TLS con SNI.
- **Bloque 6 · HTTPS para todos y las API (15 y 16).** Dónde termina TLS, la redirección y los datos para programas.
- **Bloque 7 · La guardia (17).** Siete casos en el orden completo de diagnóstico.

### La guardia

Un solo id, `03-17`, con siete casos. Cada uno es un cambio sobre el mundo del 16 y su report lo dice. El caso 1 es guiado, con las seis preguntas en orden. Las tres primeras son del capítulo 2 (¿resuelve el nombre?, ¿hay ruta?, ¿contesta el puerto?) y las otras tres son nuevas (¿completa el saludo TLS?, ¿qué código vuelve?, ¿quién lo generó?).

| Caso | Causa | Lo que se ve | Opciones incorrectas (el error que reflejan) |
|------|-------|--------------|----------------------------------------------|
| 1 (guiado) | El proceso de la app de `servidor-app` terminó | Resuelve, hay ruta, el 443 contesta y el saludo se completa. Vuelve un 502 generado por `servidor-nuevo`. Un `curl` directo a `servidor-app:3000` da `Connection refused` | «El certificado venció» (el saludo se completó) · «La app falló y dio 500» (un 500 del origen pasa tal cual; este código lo generó el proxy) |
| 2 (repara) | `lucia.example` no está en el SAN del certificado | Falla la validación del nombre y no hay ningún código. El jugador pide un certificado que cubra `lucia.example` | «El servidor dio 404» (no hubo código) · «Es autofirmado» (la cadena llega a una raíz) |
| 3 | El certificado de `blog.lucia.example` venció | Falla la validación por fecha | «El nombre no está en el SAN» (coincide) · «El proxy no alcanza el origen» (eso sería un 502, y habría código) |
| 4 | Marta está autenticada y no tiene permiso | 403 en `/admin` | «Su contraseña está mal» (eso sería 401) · «El proxy no tiene a quién reenviar» (eso sería 503) |
| 5 | La app redirige a HTTPS detrás de la terminación de TLS | Demasiadas redirecciones | «El 443 está cerrado» (habría rechazo, no 301 repetidas) · «HSTS bloquea el sitio» (HSTS no redirige) |
| 6 | El origen tarda más que la espera del proxy | 504 | «La app se cayó» (eso sería 502) · «No hay orígenes en la lista» (eso sería 503) |
| 7 | `curl https://192.168.1.11:3000/`: la app habla HTTP sin TLS | Error en el saludo TLS, sin código | «El firewall descarta» (sería silencio) · «Falta la IP en el SAN» (la app no tiene certificado) |

El caso 7 es el modo de fallo nuevo del capítulo: ni nadie escucha ni un firewall calla; el proceso habla otro protocolo. Casos de reserva, si alguno no cierra: el 429 de todos (07), el 502 en el cruce (09), `http://` con el 80 cerrado (necesita un firewall en los servidores de internet, que D-14 = A deja fuera) y la cadena incompleta (ver «Lo que la simulación enseña»).

## Escalera de términos

Cada término se presenta en el subcapítulo que lo necesita, ni antes ni después, con una definición rigurosa de 120 caracteres o menos que no nombra términos que el jugador aún no conoce. Son 65: 55 de núcleo y 10 de apoyo. Todos son ids nuevos del registro (`src/copy/terms.ts`): el registro pasa de 106 a 171 términos y el jugador conoce 156 antes de pisar el capítulo 4 (38 del capítulo 1, 53 del 2 y 65 de este).

**Cómo se calculó (2026-10-11).** Un script de Node en el directorio temporal de la sesión, que no queda en el repo:

1. Carga `src/copy/terms.ts` del worktree del capítulo 2 (106 términos: 38 del capítulo 1, 53 del 2 y 15 que son solo del 4) y lee los `introduces` de los incidentes del capítulo 1 y los ids de la tabla del spec del capítulo 2 para saber cuáles 15 son solo del capítulo 4.
2. Lee la tabla de 65 términos de la investigación y la asignación a subcapítulos de la propuesta, con dos definiciones reescritas: `curl` (sube del puesto 60 al 01) y `session-key` (D-10).
3. Repite `namedTerms` de `src/levels/ladder.ts`: el nombre entero, sin distinguir mayúsculas, con plural `s` o `es`.
4. Comprueba cinco cosas:
   - que ninguna definición nombre un término de un subcapítulo posterior;
   - que ninguna nombre un término solo del capítulo 4;
   - que ninguna definición de los capítulos 1, 2 o 4 nombre un término nuevo;
   - que ninguna mida más de 120 caracteres;
   - que los ids sean nuevos y no estén retirados (`server`, `request`, `response`, `linux-ignore-ping`).
5. Repite la comprobación con una regla más laxa (cada palabra del nombre en plural y sin tildes).
6. Revisa los textos de los capítulos 1 y 4, la copia y las vistas que existen hoy buscando como palabra corriente el nombre de cada uno de los 65 términos.

**Resultado.**
- 65 términos, cada uno una vez. Suman 65, con mínimo 3 y máximo 6 por subcapítulo.
- 0 problemas hacia adelante, hacia atrás y con los 15 términos del capítulo 4.
- 0 aciertos con la regla laxa.
- Ningún id repetido ni retirado.
- La definición más larga mide 120; la de `curl`, 105; la de `session-key`, 114.

La búsqueda de palabras corrientes (paso 6) no encontró ningún choque real en los capítulos 1 y 4. Solo aparecieron identificadores de código (`path`, `rest`) y el título del capítulo 13 «Una API sin servidores» en `CHAPTERS`. Un título de temario puede nombrar el término que enseña otro capítulo. Los textos del capítulo 2 todavía no existen; el plan repite la búsqueda sobre ellos en su primera tarea y en la Tarea 3.

**Términos del capítulo 4 que se mudan.** Ninguno. El plan del capítulo 4 (04-03 a 04-08) no nombra ninguno de los 65 por su nombre ni por su id: se buscaron en el [spec de incidentes en vivo](2026-10-08-follow-the-packet-live-incidents-design.md), la [hoja de capítulos](../research/2026-10-09-follow-the-packet-chapters.md), el [plan de 33 capítulos](../plans/2026-10-10-follow-the-packet-33-chapters.md), el [spec del prototipo](2026-10-07-follow-the-packet-design.md) y el [backlog](../plans/2026-10-08-follow-the-packet-followups.md), y todos los aciertos son falsos (URLs, archivos `.json`, identificadores de código). Los términos que el capítulo 4 ya tenía registrados («del capítulo 4», 15 en total) no chocan con ninguno de los 65.

**Dos definiciones que cambian respecto de la investigación.**

- **`curl`** (sube del 60 al 01). Antes: «Herramienta de consola que hace una petición HTTP y muestra la respuesta. Con -v, también el saludo TLS y las cabeceras.» (120). Ahora: «Una herramienta de consola que pide por HTTP lo que señala una URL y muestra lo que contesta el servidor.» (105). La de antes nombra `petición HTTP` (02) y `saludo TLS` (14). Lo que se pierde («con -v…») va al texto del 04 y del 14. Precedente: el `nc` del 02-01, que se presentó antes que TCP.
- **`session-key`** (D-10 = B). Antes: «La clave simétrica que ambos calculan en el saludo TLS. Cifra los datos de esa conexión y nunca viaja por la red.» (113). Ahora: «La clave simétrica que ambos calculan en el saludo TLS, una por sentido. Cifra los datos y nunca viaja por la red.» (114). Fuente: RFC 8446 §7.1 y §7.3, leídos el 2026-10-11. Un cliente y un servidor usan una clave para lo que el cliente envía y otra para lo que envía el servidor, derivadas del mismo secreto.

**Los 18 términos que cambian de lugar respecto del orden de la investigación** (D-4 = A). El script cuenta cuántos; este reparto los agrupa por motivo.

| Términos (n.º en la investigación) | Van al | Por qué |
|------------------------------------|--------|---------|
| `curl` (60) | 01 | Lo primero que viaja necesita una herramienta |
| `process` (1) | 03 | Solo se ve junto al servidor web: rechazo frente a respuesta. Su definición solo nombra términos del capítulo 2 |
| `http-header` (10), con `web-server` (11) y `browser` (12) delante | 04 | La primera cabecera con propósito es Host. Es un intercambio entre vecinos |
| `status-404` (26) | 05 | Es el 4xx más común y va con la clase |
| `cookie` (38) | 06 | Es cómo el navegador lleva quién eres tras iniciar sesión |
| `status-429` (27) antes de `server-error` (28) y `status-500` (29); `reverse-proxy` (30), `origin-server` (31) y `x-forwarded-for` (35) juntos | 07 y 08 | El 429 de todos explica para qué sirve X-Forwarded-For. El 08 necesita el proxy |
| `status-502` (32) | 09 | Va con la conexión persistente y el idle timeout |
| `tls` (46) y `https` (57) | 10 | Primero el problema (qué ve el camino) y después cómo funciona |
| `hash` (44) | 12 | Aparece cuando el impostor edita un certificado |
| `openssl-s-client` (61) | 12 | Su definición dice que muestra la cadena |
| `san` (49) y `wildcard-certificate` (50) | 13 | Primero quién firma, después para qué nombre |
| `http-versions` (65) | 14 | La versión se acuerda en el saludo |
| `redirect` (17), `status-301` (18) y `tls-termination` (58) | 15 | La redirección es a HTTPS y va donde termina TLS |

**La tabla de los 65.** Las definiciones son propuestas: parten de las de la investigación. **`ladder.test.ts` y `chapter-3.test.ts` deciden.** Esta tabla la generó el script a partir de la investigación y de la asignación; no se escribió a mano.

| Inc. | Id | Término | Definición (máx. 120 caracteres) | Largo | Nivel |
|------|----|---------|----------------------------------|-------|-------|
| 01 | `http` | HTTP | HyperText Transfer Protocol: el protocolo con que un cliente pide un recurso (página, dato) y el servidor responde. | 115 | Núcleo |
| 01 | `url` | URL | Uniform Resource Locator: la dirección de un recurso web. Por ejemplo: http://lucia.example:8080/pedidos?id=7 | 109 | Núcleo |
| 01 | `url-path` | path | La parte de la URL que va después del nombre y del puerto, como /pedidos. Dice qué recurso del servidor se pide. | 112 | Núcleo |
| 01 | `query-string` | query string | Lo que va en la URL después de ?, como id=7: pares nombre=valor que precisan lo que se pide. | 92 | Apoyo |
| 01 | `curl` | curl | Una herramienta de consola que pide por HTTP lo que señala una URL y muestra lo que contesta el servidor. | 105 | Núcleo |
| 02 | `http-request` | petición HTTP | El mensaje con que un cliente pide algo: método, path con su query string, cabeceras y, a veces, un cuerpo de datos. | 116 | Núcleo |
| 02 | `http-response` | respuesta HTTP | El mensaje con que el servidor contesta: un código numérico, cabeceras y, a veces, un cuerpo de datos. | 102 | Núcleo |
| 02 | `http-method` | método HTTP | Lo que la petición quiere hacer: GET lee un recurso, POST le manda datos, PUT lo reemplaza y DELETE lo borra. | 109 | Núcleo |
| 02 | `idempotent` | idempotente | Una operación es idempotente si repetirla deja el mismo efecto que hacerla una vez. GET, PUT y DELETE lo son; POST, no. | 119 | Núcleo |
| 03 | `process` | proceso | Un programa mientras corre en un dispositivo. Un servicio escucha desde un proceso; si este termina, deja de escuchar. | 118 | Núcleo |
| 03 | `web-server` | servidor web | Un servicio que contesta peticiones HTTP. Por defecto escucha en el puerto 80, aunque puede usar cualquier otro. | 112 | Núcleo |
| 03 | `browser` | navegador | Un programa que hace peticiones HTTP a nombre de una persona y muestra las respuestas. Es un cliente. | 101 | Núcleo |
| 04 | `http-header` | cabecera HTTP | Una línea «nombre: valor» de una petición o respuesta, como Content-Type. No es el encabezado del paquete. | 106 | Núcleo |
| 04 | `host-header` | cabecera Host | La cabecera HTTP con el nombre y el puerto de la petición. Un servidor con varios sitios la usa para elegir uno. | 112 | Núcleo |
| 04 | `virtual-host` | host virtual | Un sitio entre varios que comparten un servidor web y una IP. La cabecera Host dice cuál se pide. | 97 | Núcleo |
| 05 | `status-code` | código de estado | El código de tres cifras con que una respuesta HTTP dice cómo salió la petición. La primera cifra da la clase. | 110 | Núcleo |
| 05 | `status-200` | 200 OK | La petición se cumplió. Con un GET, el cuerpo de la respuesta trae el recurso pedido. | 85 | Núcleo |
| 05 | `client-error` | error 4xx | Un código 4xx: la petición, tal como llegó, no se puede cumplir. Parece un error del cliente, pero no siempre lo es. | 116 | Núcleo |
| 05 | `status-404` | 404 Not Found | No hay un recurso en esa URL, o el servidor no quiere decir si existe. | 70 | Núcleo |
| 05 | `status-400` | 400 Bad Request | El servidor rechaza la petición porque está mal formada o trae datos que no acepta. | 83 | Apoyo |
| 06 | `authentication` | autenticación | Comprobar quién hace una petición, por ejemplo con una contraseña o una clave. | 78 | Núcleo |
| 06 | `authorization` | autorización | Decidir qué puede hacer quien ya se identificó, según sus permisos. Va después de la autenticación. | 99 | Núcleo |
| 06 | `authorization-header` | cabecera Authorization | La cabecera HTTP con que el cliente manda cómo se identifica. Pese al nombre, sirve para autenticar, no para autorizar. | 119 | Núcleo |
| 06 | `status-401` | 401 Unauthorized | Falta una autenticación válida: el servidor no sabe quién eres. Pese al nombre, habla de autenticación. | 103 | Núcleo |
| 06 | `status-403` | 403 Forbidden | El servidor entendió la petición y se niega: no hay permiso o una restricción lo impide. Repetirla igual no cambia nada. | 120 | Núcleo |
| 06 | `cookie` | cookie | Un dato que el servidor manda con Set-Cookie y que el navegador devuelve en las peticiones siguientes a ese sitio. | 114 | Apoyo |
| 07 | `reverse-proxy` | proxy inverso | Un servidor que recibe peticiones HTTP en nombre de otro y las reenvía por otra conexión. El cliente solo ve al proxy. | 118 | Núcleo |
| 07 | `origin-server` | servidor de origen | El servidor que genera la respuesta definitiva de un recurso, detrás de los proxies inversos que haya en medio. | 111 | Núcleo |
| 07 | `x-forwarded-for` | X-Forwarded-For | Cabecera HTTP con la IP del cliente que añade un proxy inverso. Sin ella, el servidor de origen solo ve la IP del proxy. | 120 | Apoyo |
| 07 | `status-429` | 429 Too Many Requests | El cliente mandó demasiadas peticiones en poco tiempo. Quien limita puede añadir Retry-After: cuándo reintentar. | 112 | Núcleo |
| 08 | `server-error` | error 5xx | Un código 5xx: el servidor sabe que falló o no puede cumplir una petición que parece válida. | 92 | Núcleo |
| 08 | `status-500` | 500 Internal Server Error | El servidor tuvo un fallo inesperado al atender la petición y no dice más. | 74 | Apoyo |
| 08 | `status-503` | 503 Service Unavailable | El servidor no puede atender ahora, por sobrecarga o mantenimiento. Un proxy inverso lo da si no tiene a quién reenviar. | 120 | Núcleo |
| 08 | `status-504` | 504 Gateway Timeout | Un proxy inverso no recibió respuesta del servidor de origen a tiempo. Quizá la petición ni llegó. | 98 | Núcleo |
| 09 | `status-502` | 502 Bad Gateway | Un proxy inverso no obtuvo respuesta válida del servidor de origen: conexión rechazada o cortada, o respuesta ilegible. | 119 | Núcleo |
| 09 | `persistent-connection` | conexión persistente | Una conexión TCP que se reutiliza para varias peticiones HTTP seguidas, en vez de abrir una por petición. | 105 | Núcleo |
| 09 | `idle-timeout` | idle timeout | El tiempo que una conexión puede estar sin datos antes de que un extremo la cierre. Cada extremo tiene el suyo. | 111 | Núcleo |
| 10 | `encryption` | cifrado | Convertir datos en un texto ilegible con una clave. Solo quien tiene la clave adecuada puede volver a leerlos. | 110 | Núcleo |
| 10 | `symmetric-encryption` | cifrado simétrico | Cifrado con una sola clave, la misma para cifrar y descifrar. Es rápido, pero ambas partes deben compartirla en secreto. | 120 | Núcleo |
| 10 | `tls` | TLS | Transport Layer Security: protocolo que comprueba quién es el servidor y cifra los datos en tránsito. Sucede a SSL. | 115 | Núcleo |
| 10 | `https` | HTTPS | HTTP dentro de una conexión TLS: los mismos mensajes, cifrados. Su puerto por defecto es el 443. | 96 | Núcleo |
| 11 | `asymmetric-encryption` | cifrado asimétrico | Cifrado con un par de claves: una pública, que se reparte, y una privada, que su dueño no comparte. Cifra y firma. | 114 | Núcleo |
| 11 | `public-key` | clave pública | La mitad del par que se reparte a todos. Cifra datos para su dueño y comprueba sus firmas. | 90 | Núcleo |
| 11 | `private-key` | clave privada | La mitad del par que su dueño no comparte nunca. Descifra lo que cifró la pública y crea las firmas. | 100 | Núcleo |
| 11 | `digital-signature` | firma digital | Prueba creada con una clave privada sobre unos datos. Con la clave pública se comprueba quién firmó y que nada cambió. | 118 | Núcleo |
| 11 | `certificate` | certificado | Un documento firmado por una entidad de confianza que une nombres con una clave pública. No incluye la clave privada. | 117 | Núcleo |
| 12 | `hash` | hash | Un resumen de tamaño fijo de unos datos. Si los datos cambian, el hash cambia; del hash no se recuperan los datos. | 114 | Núcleo |
| 12 | `certificate-authority` | autoridad certificadora | Autoridad certificadora (CA): la entidad que firma certificados tras comprobar que quien los pide controla el nombre. | 117 | Núcleo |
| 12 | `certificate-chain` | cadena de certificados | Los certificados encadenados: el del servidor, el de la CA que lo firmó y así hasta una raíz que el cliente ya trae. | 116 | Núcleo |
| 12 | `self-signed-certificate` | certificado autofirmado | Un certificado firmado con su propia clave privada, sin CA. Solo vale para quien decida confiar en él. | 102 | Apoyo |
| 12 | `openssl-s-client` | openssl s_client | Una herramienta de consola que abre una conexión TLS a un nombre y un puerto y muestra el certificado y la cadena. | 114 | Apoyo |
| 13 | `san` | SAN | Subject Alternative Name: la lista de nombres que cubre un certificado. El cliente busca ahí el nombre que pidió. | 113 | Núcleo |
| 13 | `wildcard-certificate` | certificado comodín | Certificado de *.lucia.example: cubre un nivel (www.lucia.example), pero no lucia.example ni a.b.lucia.example. | 111 | Núcleo |
| 13 | `certificate-validation` | validación del certificado | Lo que comprueba el cliente: el nombre en el SAN, la cadena hasta una raíz de confianza y que hoy esté en sus fechas. | 117 | Núcleo |
| 14 | `tls-handshake` | saludo TLS | Los mensajes que abren una conexión TLS: el servidor muestra su certificado y ambos acuerdan versión y claves. | 110 | Núcleo |
| 14 | `session-key` | clave de sesión | La clave simétrica que ambos calculan en el saludo TLS, una por sentido. Cifra los datos y nunca viaja por la red. | 114 | Apoyo |
| 14 | `sni` | SNI | Server Name Indication: el nombre que el cliente manda, casi siempre sin cifrar, en el saludo TLS. Elige el certificado. | 120 | Núcleo |
| 14 | `http-versions` | versiones de HTTP | HTTP/1.1 y HTTP/2 van sobre TCP; HTTP/3, sobre UDP. Los métodos, las URL y los códigos de estado son los mismos. | 112 | Apoyo |
| 15 | `tls-termination` | terminación de TLS | El punto donde acaba la conexión TLS del cliente y se descifra la petición. Desde ahí puede seguir por otra conexión. | 117 | Núcleo |
| 15 | `redirect` | redirección | Una respuesta que manda a otra URL (301, 302, 307, 308). Con 301 y 302 un POST puede volverse GET; con 307 y 308, no. | 117 | Núcleo |
| 15 | `status-301` | 301 Moved Permanently | El recurso tiene otra URL, permanente, en la cabecera Location. Una caché puede recordarla. | 91 | Núcleo |
| 15 | `hsts` | HSTS | HTTP Strict Transport Security: cabecera que ordena al navegador usar solo HTTPS con ese nombre durante un tiempo. | 114 | Apoyo |
| 16 | `api` | API | Application Programming Interface: las operaciones que un programa ofrece a otros programas y la forma de pedirlas. | 115 | Núcleo |
| 16 | `json` | JSON | JavaScript Object Notation: texto para datos, con objetos { }, listas [ ], textos, números, true, false y null. | 111 | Núcleo |
| 16 | `rest` | REST | Representational State Transfer: estilo de API web con recursos en URL, métodos HTTP y enlaces. No exige JSON. | 110 | Núcleo |

Total: 65.

Notas de la tabla:

- **Orden de las definiciones.** Cada una usa solo términos de los capítulos 1 y 2, del mismo subcapítulo o de uno anterior. Cuando dos términos se necesitan entre sí, el primero usa palabras corrientes para las partes del otro (por ejemplo «cabeceras» sin etiqueta) y el segundo ya puede nombrar al primero.
- **Palabras que no son términos.** «recurso», «caché», «raíz», «extremo», «SSL» y los nombres de cabeceras (`Location`, `Retry-After`, `Set-Cookie`, `Content-Type`) aparecen en las definiciones como palabras corrientes o como ejemplo y no se registran. GET, POST, PUT y DELETE los define `método HTTP`.
- **Nombres que se evitaron.** «Host» solo, porque la definición de `dispositivo` dice «También se le llama host»; por eso son «cabecera Host» y «host virtual». «Encabezado» es la parte del paquete (capítulo 1): para HTTP es «cabecera HTTP». «Ruta» es la instrucción de reenvío (capítulo 2): la parte de la URL se llama «path». «Clave» siempre lleva apellido (pública, privada, de sesión). «Gateway» no es la puerta de enlace predeterminada: en «502 Bad Gateway» es un proxy inverso.
- **Ids.** Son kebab-case en inglés, nuevos y distintos de los ids retirados. `terms.test.ts` exige que solo `ip-address` y `security-group` tengan forma corta: las siglas (`CA`, `SAN`, `SNI`) se expanden dentro de la definición.
- **Los 65 en cifras.** 5 + 4 + 3 + 3 + 5 + 6 + 4 + 4 + 3 + 4 + 5 + 5 + 3 + 4 + 4 + 3. El plan lo vuelve prueba (`chapter-3.test.ts`) y tabla de cobertura.

## Lo que la simulación enseña

La simulación sigue siendo un solo motor (`src/engine/`) que calcula el resultado de cada envío; ningún texto lo decide. Las etiquetas son las de la investigación: **[fuente]** lo leí en la fuente citada, **[local]** lo probé en el Mac del estudiante, **[inferencia]** lo deduzco, **[sin verificar]** no lo comprobé. Lo nuevo de hoy dice «leído el 2026-10-11».

- **El mensaje HTTP no es un paquete.** Viaja en los datos de la conexión TCP que abrió el saludo de tres pasos, partido en los paquetes que haga falta. Los límites del mensaje no los conserva TCP (investigación del capítulo 2, 4.1). El juego dibuja la conexión con las formas de TCP y muestra el mensaje en la caja (V20).
- **La URL.** Esquema, nombre o IP, puerto, path y query string (RFC 9110 §4.2 y RFC 3986 §3). El fragmento `#…` no llega al servidor (RFC 9110 §7.1; RFC 3986 §3.5) **[fuente]**. Sin puerto, `http` va al 80 y `https` al 443 (RFC 9110 §4.2.1 y §4.2.2) **[fuente]**.
- **Métodos.** GET, PUT y DELETE son idempotentes; POST no. Idempotente habla del **efecto** pedido, no de la respuesta: un segundo DELETE puede dar 404 y el estado del servidor es el mismo. No es lo mismo que «seguro» (RFC 9110 §9.2) **[fuente]**. Un cliente no debe reintentar solo una petición no idempotente y **un proxy no debe reintentarla nunca** (RFC 9110 §9.2.2) **[fuente]**.
- **Cabecera Host.** En HTTP/1.1 es obligatoria y un servidor responde 400 a una petición que no la trae (RFC 9112 §3.2) **[fuente]**. Lleva el nombre de la URL aunque el DNS haya seguido un CNAME **[inferencia]** de RFC 9110 §7.2. Cada servidor decide qué hace con un nombre que no tiene sitio (403, 404, 421, 409 o un sitio por defecto) **[local]**: el del juego sirve el sitio por defecto.
- **Los once códigos.** 200, 301, 400, 401, 403, 404, 429, 500, 502, 503 y 504, más las clases 4xx y 5xx. Cada uno lo genera al menos un servicio de AWS con una causa propia. En la investigación la tabla de «quién genera cada código» es la 6.1. Un 4xx **parece** un error del cliente y no siempre lo es (RFC 9110 §15.5) **[fuente]**. El juego usa 200 y no 201 para el POST que crea un pedido: 200 es válido para un POST (RFC 9110 §15.3.1) **[fuente]** y 201 no es uno de los once.
- **401 y 403.** El 401 dice que la petición no trae credenciales válidas y el servidor debe mandar `WWW-Authenticate` (RFC 9110 §15.5.2). El 403 dice que el servidor entendió y se niega; repetirla igual no cambia nada (§15.5.4). Los nombres engañan: «Unauthorized» y «Authorization» hablan de **autenticación** (§11.6.2) **[fuente]**. Un 403 puede esconder un 404 (§15.5.4) **[fuente]**. En AWS el número solo no basta: API Gateway da 403 a un token que falta **[fuente]**, y hay que ver quién generó el código.
- **Proxy inverso.** «Gateway» es un proxy inverso: un intermediario que actúa como servidor de origen hacia afuera y traduce y reenvía hacia adentro (RFC 9110 §3.7). Una petición que pasa por un intermediario usa **conexiones separadas**. El 502 es «invalid response from an inbound server»; el 504, «did not receive a timely response»; el 503, «unable to handle the request due to a temporary overload or scheduled maintenance» (RFC 9110 §15.6) **[fuente]**. El proxy pasa tal cual lo que el origen contesta, incluidos sus errores válidos: «forwards valid HTTP responses from targets to the client, including HTTP errors» (AWS, ALB) **[fuente]**. El 503 del juego sale de una **lista de orígenes vacía**, el caso «no registered targets» del ALB **[fuente]**. El juego **no** enseña «todos los orígenes caídos = 503»: un ALB así falla abierto (capítulo 7) **[fuente]**.
- **Conexión persistente e idle timeout.** HTTP/1.1 reutiliza la conexión (RFC 9112 §9.3). Quien quiere cerrar una inactiva debe hacerlo con un cierre limpio, y las implementaciones **deben vigilar** las conexiones abiertas para ver si les llegó un cierre (§9.5, SHOULD). El 502 aparece en el **cruce**: «a client might have started to send a new request at the same time that the server has decided to close the "idle" connection» (§9.5) **[fuente]**. AWS lo documenta para el ALB: comprobar si el keep-alive del destino es menor que el idle timeout del balanceador **[fuente]**. El idle timeout por defecto del ALB es de 60 s **[fuente]** y el `keepAliveTimeout` de Node es de 5000 ms **[fuente]** y **[local]**. **La espera de 10 s del plan aprobado para el 09 contradice §9.5 en un proxy genérico:** es la decisión abierta D-19.
- **HTTPS no es otro protocolo.** Es HTTP dentro de una conexión TLS. El 443 es costumbre (RFC 9110 §4.2.2) **[fuente]**. `http://x` y `https://x` son orígenes distintos. Un cliente HTTPS debe verificar la identidad del servidor (§4.3.4) **[fuente]**.
- **Qué ve el camino bajo TLS 1.3.** Ve las IP, los puertos y el SNI. No ve el certificado (RFC 8446 §1.2: «All handshake messages after the ServerHello are now encrypted»), ni el método, el path, las cabeceras, las cookies, el cuerpo ni el código **[fuente]**. El SNI viaja en claro salvo con ECH (RFC 6066 §3; RFC 9849 §1) **[fuente]**. La consulta DNS también viaja en claro (RFC 9849 §1) **[fuente]**. En el juego todos los servidores hablan TLS 1.3 (simplificación declarada). La tabla completa está en la investigación, 4.4.
- **Certificado frente a clave privada.** El certificado es público: une nombres a una clave **pública** y lo firma una autoridad (RFC 5280 §4). Perderlo no compromete a nadie. La clave privada es el secreto. **En TLS 1.3 la clave privada del certificado no descifra nada: firma.** `CertificateVerify` es «a signature over the entire handshake using the private key corresponding to the public key in the Certificate message» (RFC 8446 §2) y «Static RSA and Diffie-Hellman cipher suites have been removed» (§1.2) **[fuente]**. La clave de sesión sale de un intercambio efímero y es una por sentido (§7.1 y §7.3, leídos el 2026-10-11).
- **El impostor.** Un servidor real no arranca con un certificado cuya clave pública no corresponde a su clave privada. `servidor-falso` es entonces un **programa a medida**: presenta la copia del certificado de Lucía y firma el saludo con **su propia** clave, porque no tiene la de Lucía. El cliente comprueba la firma con la clave pública del certificado y no cuadra. La línea del error sale de leer el código de OpenSSL 3.5.8 (`ssl/statem/statem_lib.c`, `SSL_R_BAD_SIGNATURE`), **no de una corrida**.
- **Qué valida un cliente.** El nombre, comparado con el SAN y nunca con el CN (RFC 9110 §4.3.4; RFC 9525 §1.3 y §2). El nombre sale de la URL, no de la IP. El comodín solo cubre la etiqueta de más a la izquierda y solo un nivel (RFC 9525 §6.3). La cadena, hasta un ancla de confianza que el cliente tenga (RFC 5280 §6.1). Las fechas, «from notBefore through notAfter, inclusive» (RFC 5280 §4.1.2.5) **[fuente]**. Cada cliente tiene su propia lista de raíces. `NODE_TLS_REJECT_UNAUTHORIZED=0` no es un arreglo **[fuente]**.
- **Cambiar un byte.** Cambia el hash y la firma de la autoridad deja de valer. Por eso el 13 **no deja editar** los nombres de un certificado: el jugador pide uno nuevo (D-21).
- **SNI.** Un nombre que es una IP no viaja en el SNI (RFC 6066 §3) **[fuente]**. Sin SNI, un ALB da su certificado por defecto **[fuente]**; otros servidores cortan el saludo **[local]** (D-13 = A: el del juego da el certificado por defecto).
- **Redirección.** 301 y 302 permiten que un POST se vuelva GET; 307 y 308, no (RFC 9110 §15.4). `curl -L -d` sobre una 301 termina en GET (lib/http.c de curl 8.21.0, leído el 2026-10-11) y sobre una 307 conserva el POST (rama por defecto del mismo `switch`). El ALB solo hace 301 y 302 **[fuente]**. La redirección necesita el 80 abierto y escuchando. Detrás de una terminación de TLS la app ve HTTP: si redirige siempre, hay un bucle. El ALB manda `X-Forwarded-Proto` para evitarlo **[fuente]**.
- **HSTS.** Solo vale por HTTPS, no cubre la primera visita, no aplica a una IP y quita el «continuar de todos modos» (RFC 6797 §7.2, §8.1, §8.3, §8.4 y §14.6) **[fuente]**.
- **REST y JSON.** REST es un estilo con recursos en URL, métodos y enlaces, no «JSON por HTTP» (Fielding, tesis §5.1 y §5.2; «REST APIs must be hypertext-driven», 2008) **[fuente]**. JSON no es un objeto de JavaScript (RFC 8259) **[fuente]**: `{'a':1}` y `{a:1}` dan `SyntaxError` **[local]**.
- **Cookies.** Un dato que el servidor manda con `Set-Cookie` y el navegador devuelve (RFC 6265 §1). `curl` **no** guarda ni manda cookies si no se le pide con `-b`, que además activa el motor de cookies; `-c` guarda un archivo (docs/cmdline-opts/cookie.md de curl 8.21.0, leído el 2026-10-11) **[fuente]**. Cada petición se entiende sola (RFC 9110 §3.3); lo que une varias es la cookie. El texto no registra «sin estado».

### Las herramientas, como las imprime su código

Reglas (D-12 = A): cada línea que el juego imprime sale del código de la versión que imita o de una corrida real, con su fuente y su fecha en el test que la fija. **Lo que no se verificó no se imprime** y la caja lo dice con palabras. Lo que depende de cada servidor y no se puede verificar para uno ficticio (el cifrado negociado, el grupo de la clave, los bytes leídos y escritos, los tiempos, el bloque PEM de un certificado) se omite o se declara ilustrativo, como el RTT del capítulo 2.

**Versiones (leído el 2026-10-11).** La lista de paquetes de la versión 2023.12.20260930 de Amazon Linux 2023 (https://docs.aws.amazon.com/linux/al2023/release-notes/all-packages-AL2023.12.html) trae `curl` 8.21.0-5.amzn2023.0.2, `openssl` 3.5.8-1.amzn2023.0.1, `nmap` 7.93-4.amzn2023 (de donde sale `nmap-ncat`), `bind` 9.18.50-1.amzn2023.0.3 (de donde sale `bind-utils`) y `nginx` 1.30.5-1.amzn2023.0.1. Lo que `nc` y `dig` imprimen no cambia respecto del capítulo 2. La lista nombra `curl-minimal` y `curl` como binarios del mismo paquete fuente; **cuál instala la AMI estándar no se verificó**. Se leyó el código fuente **original** (`curl-8.21.0.tar.xz` de https://curl.se/download/ y `openssl-3.5.8.tar.gz` de https://github.com/openssl/openssl/releases/); **los parches de Amazon no se leyeron**.

**Líneas de `curl` 8.21.0 ya leídas** (2026-10-11; rutas relativas al árbol del código fuente):

| Línea o comportamiento | Fuente |
|------------------------|--------|
| `curl: (<código>) <mensaje>`, por stderr | `src/tool_operate.c`, línea 619 |
| (6) `Could not resolve host: <nombre>` (hay otro texto, `Could not resolve: <host>:<puerto>`, en `lib/hostip.c` líneas 734 y 1072; no se aisló cuál usa la AMI, y ningún incidente falla por un nombre que no resuelve, así que el juego no lo imprime) | `lib/asyn-base.c` línea 259 y `lib/hostip.c` línea 348 |
| (7) `Failed to connect to <host>:<puerto> after <N> ms: Could not connect to server` (con **dos puntos** entre host y puerto) | `lib/cf-ip-happy.c` línea 738 y `lib/strerror.c` línea 61 |
| (28) Ante un silencio, el código tiene **dos caminos con dos textos**: `Connection timed out after <N> milliseconds` y `Failed to connect to <host>:<puerto> after <N> ms: Timeout was reached`. Cuál sale depende de cuál lo nota primero. **El juego no imprime ninguno** y la caja dice «curl esperó y se rindió (código 28)» | `lib/multi.c` línea 1832; `lib/cf-ip-happy.c` líneas 572 y 738 con `lib/strerror.c` línea 121 |
| (60) `SSL certificate problem: <texto de OpenSSL>`, seguida de «More details here: https://curl.se/docs/sslcerts.html» y el párrafo «curl failed to verify the legitimacy of the server…» | `lib/vtls/openssl.c` línea 4220; `src/tool_operate.c` líneas 91 a 96 y 622 |
| (60) `SSL: no alternative certificate subject name matches target hostname '<nombre>'` (con una IP: `target ipv4 address '<ip>'`) | `lib/vtls/openssl.c` línea 2150 |
| (35) `TLS connect error: OpenSSL/<versión>: error:<código>:<biblioteca>::<razón>` | `lib/vtls/openssl.c` líneas 748 (`ossl_strerror`) y 4256; `Curl_ossl_version` |
| (47) `Maximum (<n>) redirects followed`, con n = 50 en la herramienta | `lib/http.c` línea 1265; `src/tool_main.h` línea 28 |
| En `-v`, los prefijos `* `, `< ` y `> ` | `src/tool_cb_dbg.c` línea 60 |
| Con `-L`, una 301, 302 o 303 cambia un POST a GET; una 307 o 308 lo conserva | `lib/http.c`, `switch` de las líneas 1290 a 1350 |
| `-b` manda las cookies que se le dan y activa el motor de cookies; sin `-b` ni `-c` no hay cookies | `docs/cmdline-opts/cookie.md` |

**Textos de OpenSSL 3.5.8 ya leídos:** `self-signed certificate`, `self-signed certificate in certificate chain`, `certificate has expired`, `certificate is not yet valid`, `certificate signature failure`, `unable to get local issuer certificate` (`crypto/x509/x509_txt.c`); el formato `error:%08lX:%s:%s:%s` (`crypto/err/err.c` línea 561) con el código `0x0A000000 + razón` (biblioteca SSL = 20, desplazada 23 bits), que da `error:0A00010B:SSL routines::wrong version number` (razón 267, `crypto/err/openssl.txt`) para TLS a un puerto que habla HTTP: `ssl/record/methods/tlsany_meth.c` lo lanza, sin mandar una alerta, cuando los primeros bytes no parecen un registro TLS (líneas 62 a 82) y `error:0A00007B:SSL routines::bad signature` (razón 123) para el impostor sin la clave privada (`ssl/statem/statem_lib.c` líneas 580 y 591).

**Líneas de `openssl s_client` 3.5.8 ya leídas** (`apps/s_client.c` y `apps/lib/s_cb.c`): `CONNECTED(<hex>)`; por stderr, `depth=<n> <sujeto>`, `verify error:num=<n>:<texto>` y `verify return:1`; `Certificate chain`, ` <n> s:<sujeto>`, `   i:<emisor>`, `   a:PKEY: <algoritmo>, <bits> (bit); sigalg: <algoritmo>`, `   v:NotBefore: <fecha>; NotAfter: <fecha>`; `Server certificate` con `subject=` y `issuer=`; `SSL handshake has read <n> bytes and written <n> bytes`; `Verification: OK` o `Verification error: <texto>`; `New, TLSv1.3, Cipher is <suite>`; `Protocol: TLSv1.3`; `ALPN protocol: <nombre>` o `No ALPN negotiated`; `Verify return code: <n> (<texto>)`. **`openssl s_client` no comprueba el nombre del servidor salvo con `-verify_hostname` y no corta ante un error de verificación por defecto:** sigue y lo dice en `Verification error`. Por eso el 12 lo usa para leer la cadena y el 13 usa `curl` para el nombre.

**Cadena incompleta.** Ni el módulo de OpenSSL de `curl` ni `libssl` traen código para bajar el certificado intermedio que falta (se buscó `caIssuers`, `authorityInfoAccess` y `AIA`, 2026-10-11). Un servidor que no manda el intermedio da entonces `unable to get local issuer certificate` **[inferencia]**, sin corrida. Queda como caso de reserva.

**Lo que el juego no imprime** porque no puede verificarlo:
- el texto de `curl` ante un silencio (dos caminos del código, arriba);
- el cifrado y el grupo de la clave de `curl -v` y de `s_client` (en OpenSSL 3.5 depende de la configuración);
- los bytes leídos y escritos, los tiempos reales y los bloques PEM;
- la línea `Connected to` de `curl -v` (la versión 8.21.0 la escribe por un canal de traza que falta leer);
- todo lo que dependa de los parches de Amazon.

## Simplificaciones declaradas

| Simplificación | Por qué |
|----------------|---------|
| Las respuestas del juego traen solo las cabeceras que el capítulo enseña (`Content-Type`, `Content-Length`, `Location`, `Set-Cookie`, `WWW-Authenticate`, `Retry-After` y `Strict-Transport-Security`); un servidor real trae más (`Date`, `Server`, `Connection`) | Cada cabecera es un término o una idea más. La caja lo dice |
| Todos los servidores hablan HTTP/1.1 y TLS 1.3. Ninguno ofrece `h2` ni `h3`, ni ECH, ni revocación | Un Node con `http` y un nginx con la configuración mínima son HTTP/1.1 aunque haya TLS. El término `versiones de HTTP` es de apoyo y D-15 = A deja HTTP/3 en el texto |
| El navegador del juego no imita a ninguno: dice con palabras llanas lo que vio | Los textos de error de un navegador no se verificaron (D-23) |
| `localhost` resuelve a `127.0.0.1` y el juego no modela IPv6. `curl` real puede probar primero `::1` | IPv6 queda fuera de los capítulos 1 a 3 |
| La app responde 200 a un POST que crea | 200 es válido para un POST; 201 no es de los once códigos |
| Un `curl` y el navegador de `tu-laptop` comparten la lista de raíces de confianza del dispositivo | Cada cliente real tiene la suya. La tarjeta es por dispositivo; el texto lo dice |
| Una petición no adelanta el reloj del juego; solo `wait` lo adelanta. Un 504 «espera» 60 s sin que el reloj se mueva | El reloj es del jugador (V16 = C del capítulo 2) |
| La autoridad certificadora no es una pieza del mapa. Pedir un certificado lo emite y lo instala en un solo movimiento | D-11 = A. En la vida real se pide, se firma y se instala por separado |
| Las claves y las firmas son datos del juego: una firma «vale» si fue hecha con la clave privada que corresponde a la clave pública del certificado. No hay criptografía real | El juego enseña quién puede firmar, no los algoritmos |
| El hash de un certificado es una etiqueta de sus datos: si un dato cambia, la etiqueta cambia y la firma de la autoridad no cuadra | Idem |
| «Hoy» es una fecha fija del mundo que el report dice (D-22) | El motor es puro y no lee el reloj del sistema |
| El proxy no reintenta, no hace health checks, no reparte entre orígenes (usa el primero de la lista) y no falla abierto | Es el 7 (D-13 = A) |
| El límite de la app es de 10 peticiones por segundo del juego y por IP, con ventana de 1 s | Son números del juego |
| El proxy agrega la IP del cliente a `X-Forwarded-For` y el origen toma la última entrada (D-26) | Evita la entrada falsa que el cliente pueda mandar |
| La cookie del juego lleva solo nombre y valor. No hay `Secure`, `HttpOnly`, `SameSite`, caducidad ni dominio | Quedan para el capítulo 20 |
| El navegador recuerda una 301 y HSTS por el resto de la sesión. `max-age` no se agota y no hay lista precargada | El reloj del juego no llega a un año |
| La captura de `router-proveedor` muestra campos y no tamaños ni momentos | El capítulo no enseña el análisis de tráfico |
| `servidor-falso` es un programa a medida | Un servidor real no arranca con un certificado que no cuadra con su clave |
| Los pedidos de la app existen mientras dura la sesión y vuelven a su estado inicial al cambiar el mundo | El motor es puro y el estado entra como entrada |
| La salida de `curl -v` y de `openssl s_client` omite lo que no se verificó | Ver «Las herramientas, como las imprime su código» |

## Lo que el capítulo 3 hereda de los capítulos 1 y 2

1. **La secuencia pura con el reloj** (`simulateSequence`, `Carried`, `at`): lleva ahora además el estado de la app, las sesiones, el contador por IP, el pool de conexiones y la memoria del navegador.
2. **Los servicios con dirección de escucha** (`Service`, `listen`, `lookupService`) y el aviso entre «cerrado» (RST), «dirección equivocada» y «filtrado» (silencio).
3. **La tarjeta «Salida» plegable** (V11 = B) para `curl` y `openssl s_client`.
4. **La primitiva `Table`** para sitios, orígenes, certificados, raíces y cookies. La captura (V25 = A2) no es una tabla: usa `Card` y una lista de campo y valor.
5. **La primitiva `Message`** (`note`, `success`, `warning`, `error`, aspecto «Pestaña», V18) para los avisos y los errores del juego, no para lo que dice la red.
6. **Las pestañas por pieza** (V15 = B): un botón por etiqueta que abre una tarjeta con pestañas. Este capítulo las agrupa (cuatro como máximo por pieza) y pliega las tarjetas de cada pestaña (V27 = D).
7. **El reloj del juego aparte** (V16 = C): las fichas «Esperar» del 09.
8. **Las formas de paquete por protocolo con el borde rojo de intruso** (V12 = B y V19 = B). Un mensaje HTTP viaja en una conexión TCP: se dibuja con la forma de TCP.
9. **El DNS con `lucia.example`**, el archivo hosts, el resolver y la caché.
10. **Las constantes y ayudantes del capítulo 2** (`IP`, `DEVICE`, `ROUTER`, `SERVER`, `NAME`, `CHAPTER_2_DONE`) y el patrón de `shared.ts` por capítulo.
11. **El NAT de `router-oficina`:** las peticiones de la oficina salen con `203.0.113.10`. Un límite por IP también junta a los clientes de la oficina **[inferencia]**.

## Base de investigación

La investigación del capítulo 3 sigue vigente y es la base de todo lo no listado aquí; sus fuentes están en [su sección 7](../research/2026-10-11-follow-the-packet-chapter-3-concepts.md). Lo nuevo de hoy, 2026-10-11:

| Dato | Fuente |
|------|--------|
| La clave de sesión es una por sentido | RFC 8446 §7.1 (`client_application_traffic_secret_0` y `server_application_traffic_secret_0`, del mismo Master Secret) y §7.3 (`[sender]_write_key`), de https://www.rfc-editor.org/rfc/rfc8446.txt, leído el 2026-10-11 |
| Versiones de Amazon Linux 2023: `curl` 8.21.0-5, `openssl` 3.5.8-1, `nmap` 7.93-4, `bind` 9.18.50-1, `nginx` 1.30.5-1, `ca-certificates` 2025.2.76-1.0 | https://docs.aws.amazon.com/linux/al2023/release-notes/all-packages-AL2023.12.html, «as of the 2023.12.20260930 release», leído el 2026-10-11 |
| Las líneas de `curl` y los textos de error de la tabla de arriba | `curl-8.21.0.tar.xz`, descargado de https://curl.se/download/ y leído el 2026-10-11 |
| Las líneas de `openssl s_client`, los textos de verificación y el formato del código de error | `openssl-3.5.8.tar.gz`, descargado de https://github.com/openssl/openssl/releases/ y leído el 2026-10-11 |
| Un proxy debe vigilar las conexiones inactivas y el cruce es posible | RFC 9112 §9.3 y §9.5, leído el 2026-10-11 |
| Un proxy no reintenta una petición no idempotente | RFC 9110 §9.2.2, línea «A proxy MUST NOT automatically retry non-idempotent requests», leído el 2026-10-11 |
| Sin código para buscar el intermediario que falta | búsqueda de `caIssuers`, `authorityInfoAccess` y `AIA` en `lib/vtls/openssl.c` de curl y en `ssl/*.c` de OpenSSL, 2026-10-11 |
| Estado del código del capítulo 2 | Worktree `/Users/angelozdev/me/aws-commit-academy-chapter-2/`, rama `feat/chapter-2`, HEAD `a2da8eb` al empezar a leer y `4e15c90` al terminar; plan del capítulo 2 de 2030 líneas, suma SHA-256 que empieza por `65519dff`, leído entero |
| Ningún término del capítulo 4 se mueve | búsqueda de los 65 nombres e ids en los documentos del capítulo 4 (arriba) |

## Sin verificar

Lo siguiente **no** se pudo comprobar en una fuente primaria o con una corrida. El juego no lo afirma como hecho.

- **Que nada se corrió.** Ninguna línea de `curl` ni de `openssl s_client` salió de una corrida real: salen de leer el código fuente original. Faltan los parches de Amazon a `curl` y a OpenSSL, y no se sabe cuál de `curl` y `curl-minimal` trae la AMI estándar.
- **Que `curl` lea el archivo hosts en Amazon Linux antes del DNS,** igual que `ping` en el capítulo 2 **[inferencia]**.
- **Cómo se confía en `X-Forwarded-For` cuando hay varias entradas** en los programas reales. El juego fija una regla (D-26) y la declara.
- **El comportamiento real de un ALB con una espera cualquiera,** en particular si un ALB da 502 con una espera mucho mayor que el keep-alive del destino. La documentación solo habla de la condición. D-19 elige el modelo del cruce, que es el de RFC 9112 §9.5.
- **Qué hace nginx sin orígenes vivos** (502, según la memoria de la investigación) y qué códigos da un servidor sin sitio para un nombre.
- **El texto exacto de los avisos de un navegador** (D-23).
- **Qué texto da `curl` ante un silencio.** El código tiene dos caminos y sin una corrida no se sabe cuál sale. El juego no imprime ninguno.
- **La salida de `curl -v` en las líneas de conexión y de saludo** (`Connected to`, las líneas de `TLSv1.3 (OUT)`): se leerá en la tarea de salidas antes de imprimirlas.
- **Que muchos routers no hagan NAT de vuelta** (hairpin) y **que una laptop en una red con switch no reciba el tráfico de otra**, que justifican D-5 y D-7.
- **Que EC2 no mida la memoria por defecto,** que justifica D-2.
- **Lo que la investigación ya dejó sin verificar** (calendario exacto de la vida de los certificados, HTTP/3 en ALB y API Gateway, `Strict-Transport-Security` en ALB, código de API Gateway ante una excepción de Lambda, atributos de cookie, `trust proxy` de Express): sigue igual.

## Fuera del capítulo

- **CORS, caché HTTP, `Cache-Control`, `ETag` y los atributos de cookie** (capítulos 9 y 20).
- **Token, JWT, OAuth, OIDC, Cognito y `Bearer`** (20 y 19). **La firma de AWS (SigV4) y HMAC** (5). **Endpoint y credenciales** (5).
- **Cifrado de sobre, políticas de claves y cifrado en reposo** (8). **ACM en detalle, validación por DNS, renovación y exportación** (7). **Políticas de seguridad de TLS y suites de cifrado** (7). **TLS mutuo** (13 y 20). **Revocación, Certificate Transparency y PKI** (7, 26 y 32).
- **ECH, ALPN, huellas JA3 y JA4** (JA3 y JA4, 20). **QUIC por dentro** (fuera).
- **Capas OSI, «capa 4» y «capa 7»; algoritmos de reparto y afinidad de sesión; health checks y el «falla abierto»** (7). **WebSocket, SSE y gRPC** (7 y 13).
- **Otros códigos** (1xx, 201, 202, 204, 303, 304, 405, 408, 409, 413 a 415, 421, 422, 460 a 464, 507, 561, 562): cada uno llega con el servicio que lo genera.
- **CPU, memoria y disco** (D-2 = B: capítulo 7). **Tipos de ataque web** (20). **YAML y HCL** (18). **XML** (5 y 9). **OpenAPI** (13 o 18).
- **Proxy directo y túneles** (12). **DNS cifrado** (fuera). **Compresión, `Transfer-Encoding` y `Range`** (9).
- **Un firewall en los servidores de internet,** que el 80 de `servidor-nuevo` pediría para jugarse (D-14 = A lo deja fuera; sería B si la prueba humana lo pide).

## Decisiones abiertas

D-1 a D-18 las contestó el estudiante (arriba). Las ocho siguientes y las nueve visuales las contestó él el 2026-10-11, de a una. Sus opciones, la recomendación y el porqué, con las opciones inexactas marcadas, están en el plan (secciones «Decisiones abiertas» y «Decisiones visuales»). En las ocho D eligió la opción que el plan recomendaba. En las visuales también, salvo V27: el plan recomendaba mostrar solo las tarjetas que el incidente nombra y él prefirió D. V25 (A2) y V27 (D) cambiaron las Tareas 26 y 23 del plan.

| # | Pregunta | Decisión del estudiante (2026-10-11) | Tareas |
|---|----------|--------------------------------------|--------|
| D-19 | Cómo se modela el 502 de la conexión persistente | B, el cruce: el 502 sale cuando la petición del proxy y el cierre del origen coinciden (esperas de 3, 5 y 10 s; solo la de 5 s da 502). La espera de 10 s del plan aprobado se marca inexacta para un proxy genérico | 12 y 36 |
| D-20 | Cómo se arma la URL y el comando `curl` en la terminal | C, mixto: por partes, en una franja, en el 01 (V28 = B) y URL completas desde el 02 (V28 = C) | 19, 22 y 29 |
| D-21 | El certificado nuevo del 13 y del caso 2 de la guardia: editar nombres o pedir otro | B, pedir otro, que el mundo emite (D-11 = A). Editar los nombres se marca inexacta | 13, 40 y 44 |
| D-22 | La fecha de «hoy» para los certificados y las cookies | A, una fecha fija del mundo. Leer la fecha real se marca inexacta | 13 |
| D-23 | Qué texto dice el navegador | A, palabras llanas del juego, sin imitar a ningún navegador | 17 y 25 |
| D-24 | Dónde vive el navegador | A, un programa de `tu-laptop`, como una pestaña de su tarjeta (V22 = A). Una pieza aparte se marca inexacta | 17 y 25 |
| D-25 | Cómo vive el mensaje HTTP en el motor | A, una capa sobre la conexión TCP. Un paquete nuevo «HTTP» se marca inexacta | 6 |
| D-26 | Qué entrada de `X-Forwarded-For` toma el origen | A, la última, la que agregó su proxy. La primera se marca insegura | 11 |

Las nueve visuales, todas cerradas el 2026-10-11:

| # | Qué se decide | Decisión del estudiante (2026-10-11) | Tareas |
|---|---------------|--------------------------------------|--------|
| V20 | El mensaje HTTP en el mapa y en la caja | A, en la caja; el paquete conserva la forma de TCP. C se marca inexacta: el mensaje viaja dentro de los datos del paquete TCP | 26 |
| V21 | Quién generó el código | A, un campo «Quién lo generó» en la caja; la respuesta sale de quien la generó | 26 |
| V22 | El navegador de `tu-laptop` | A, una pestaña de su tarjeta con la tabla «Lo que recuerda» | 25 |
| V23 | El certificado | A, una tabla de campo y valor con la firma y la clave privada dichas con palabra y marca | 24 |
| V24 | El saludo TLS en la caja | A, una lista numerada con «(cifrado)» después del ServerHello | 26 |
| V25 | Lo que ve el camino | A2, una tarjeta con un grupo por protocolo («Por http://», «Por https://»), partido en «se lee» y «cifrado», con una lista de campo y valor. La Tarea 26 confirma que no es una primitiva nueva | 26 |
| V26 | El sello del fallo de TLS | B, un estado nuevo, «Rechazado por el cliente» (la forma la confirma la Tarea 27) | 27 |
| V27 | Muchas pestañas en una pieza | D, pestañas agrupadas más tarjetas que se pliegan. **Suma una primitiva nueva,** la sección que se pliega (excepción justificada en `DESIGN.md`) | 23 |
| V28 | La terminal de `curl` | B en el 01 y C desde el 02 (cierra D-20 = C) | 22 |

## Riesgos

- **Densidad del 06, el 11 y el 12.** Seis términos el primero y cinco difíciles cada uno los otros. Si la prueba humana los siente pesados, se parten así: el 06 en «¿Quién eres?» (autenticación, cabecera Authorization, cookie, 401) y «¿Qué puedes?» (autorización, 403 y 404, que baja del 05); el 11 en «Firmar» y el 12 en «Un documento firmado» (hash, certificado, autoridad certificadora) y «¿En quién confías?» (cadena, autofirmado, `openssl s_client`). Separar corre los ids siguientes sin costo: el capítulo no deja progreso que conservar.
- **El capítulo entero se siente largo.** Cuarenta y cinco subcapítulos antes del 04-01. Cada uno es corto por diseño, hay una prueba humana al final con un revisor de textos por bloque, y se fusiona el que sobre.
- **Mucho motor nuevo y estado nuevo.** Procesos, mensajes de aplicación, una segunda conexión, estado de la app, sesiones, contadores, un pool de conexiones, certificados, un saludo TLS, la memoria del navegador y una captura. El riesgo es tocar lo que ya funciona: el test dorado del capítulo 4, las trazas del capítulo 1 y 2 y las pruebas con nombre. Cada tarea de motor repite `git diff --exit-code src/levels/04-iaas/golden-traces.json` y corre las pruebas de los capítulos 1 y 2 sin editarlas.
- **El capítulo 2 sigue en construcción.** Este spec y su plan se escribieron con el código a medias de ese capítulo. La Tarea 1 comprueba cada pieza que el 3 reutiliza, con un script de búsquedas, y se detiene a preguntar si alguna difiere.
- **Las salidas de las herramientas dependen de la versión y de parches que no se leyeron.** Cada línea queda en un test con su fuente y su fecha; lo que no se pudo verificar no se imprime.
- **Un mapa con más piezas.** `servidor-app` y `servidor-falso` se suman al mundo y el 07, el 10 y el 15 dibujan varias a la vez. Las pruebas de geometría de Playwright se amplían a esos incidentes.
- **El plan aprobado del 09 contradice un RFC.** D-19 lo expone en vez de corregirlo en silencio.
