# Sigue el paquete: capítulo 2 «Puertos y nombres» en catorce subcapítulos

Fecha: 2026-10-11 · Estado: los 14 subcapítulos, sus términos y su reparto en bloques los aprobó el estudiante antes de escribir este documento. Las decisiones que ese reparto dejaba abiertas (D-1 a D-18) las contestó el estudiante, casi todas el 2026-10-11, igual que las visuales V10 a V19; están en «Decisiones abiertas», con sus opciones y recomendación en el plan. Plan de implementación: `docs/plans/2026-10-11-follow-the-packet-chapter-2.md`.

Desarrolla la ficha del capítulo 2 de la [hoja de capítulos](../research/2026-10-09-follow-the-packet-chapters.md) (líneas 71 a 77), con la [investigación de conceptos](../research/2026-10-10-follow-the-packet-chapter-2-concepts.md) (50 términos, correcciones de rigor, fuentes). La ficha estimaba de 4 a 8 incidentes y la investigación advirtió que, al ritmo del capítulo 1, el núcleo pedía unos 16. El estudiante aprobó 14 con 52 términos: los 50 de la investigación más «dirección de escucha» y «Port Unreachable». El 2026-10-11 pidió sumar «puerto por defecto» (D-18): son 53.

El capítulo sigue siendo el 2, de nivel 0 («Bases»), con el título «Puertos y nombres» y la carpeta `src/levels/02-ports-and-names/`. Se implementa encima del estado de la rama `feat/chapter-1-fourteen` (HEAD `5fd7c80`, el capítulo 1 terminado y todavía sin unir con `main`). De los specs anteriores sigue valiendo todo lo que el [spec del capítulo 1 en catorce](2026-10-10-follow-the-packet-chapter-1-fourteen-design.md) declara vigente: el catálogo de entidades, el modelo genérico, la mecánica `send`, la escalera de términos, el progreso y desbloqueo, y las reglas de copia.

## Por qué catorce

- **La investigación contó 50 términos.** El capítulo 1 presenta 38 en 14 incidentes (unos 2,7 por incidente). Con el mismo ritmo, 50 términos piden unos 16 incidentes solo con el núcleo. Catorce con tres a cuatro términos en promedio es el tope que el estudiante aceptó; los términos de apoyo viven en el texto de un incidente que no es suyo.
- **El capítulo 4 da por sabido lo que este capítulo enseña.** Puerto de origen y de destino, puerto efímero, rango de puertos en una regla, cerrado frente a filtrado, pertenencia a un bloque CIDR, `0.0.0.0/0`, NAT y nombre a IP (investigación, sección 2).
- **Cada subcapítulo es una sola idea** (o un par inseparable), cabe en una pantalla de lectura y termina en una pregunta.
- **Cuatro son densos: el 01, el 02, el 03 y el 10.** Cada uno trae cinco o más términos o varias causas. El plan les da tareas propias y deja anotado cómo se separan si la prueba humana del capítulo entero los siente pesados.

## Reglas de cada subcapítulo

1. Trae una idea nueva, o un par inseparable.
2. Algo viaja y termina en «llegó» o «murió por X». Única excepción declarada: el 04, donde se lee una notación y no viaja nada (D-6 = A, decidida el 2026-10-11: el jugador clasifica en una tarjeta; el 01-01 del capítulo 1 fue la primera excepción).
3. Solo usa términos de subcapítulos anteriores. El texto de una pieza, de una ficha, de un motivo y de un sello cuenta como texto. Una excepción declarada: la salida literal de una herramienta (D-5); con `ncat` 7.93 la de `nc` ya no la necesita, porque no nombra ningún término posterior.
4. Una sola pregunta de explicación por incidente, atómica, con tres opciones y una correcta. Cada opción incorrecta refleja un error real. La correcta cambia de lugar entre incidentes.
5. No hay predicciones. Lo que un subcapítulo quiere que el jugador anticipe se pregunta al final, en la explicación a Lucía (decisión del capítulo 1, D-9, que el estudiante repite para este capítulo).
6. Nunca un comportamiento distinto de la red sin decirle al jugador por qué (`.claude/rules/explained-behavior-changes.md`). Si la red se porta distinto de lo que ya vio, el report, la explicación correcta o el takeaway nombran el dispositivo o router cuya configuración cambió. Lo vigila `src/levels/explained-changes.test.ts`.
7. Rigor siempre. Entre una opción más simple y otra que modela la realidad se elige la que modela la realidad, y la otra se marca como inexacta. Toda cifra o comportamiento lleva fuente y fecha; lo que no se pudo verificar se dice.
8. Lenguaje simple: frases cortas y una idea por frase.

## Decisiones del estudiante

- **Los 14 subcapítulos, sus términos y sus bloques** (tabla de abajo). No se cambian; si algo no cierra, queda como decisión abierta.
- **Rigor siempre.** Si hay que elegir entre una opción más simple y otra que modela la realidad, se elige la segunda.
- **Ningún cambio de comportamiento sin causa.** Dos casos que el estudiante señaló: el 07 no puede hacer que un router que en el 01-08 callaba ahora avise sin decir por qué; y el NAT del 08 revela algo que ya pasaba en el capítulo 1.
- **Sin predicciones antes de actuar.** Las comprobaciones de razonamiento van en la explicación final a Lucía.
- **Una sola primitiva de interfaz por familia.** Las tarjetas nuevas usan el estilo B y las primitivas que existen; una primitiva nueva se justifica.
- **Las elecciones visuales se muestran con prototipos renderizados (HTML), nunca con dibujos de texto.** La Tarea 0 del plan los prepara.
- **La terminal muestra la sintaxis de Linux** (decisión D-10 del capítulo 1).
- **El progreso guardado se puede resetear; sin migraciones.** Los ids del capítulo 2 son nuevos, así que este capítulo no resetea nada.
- **Direcciones y nombres de documentación:** IPs de RFC 5737 para internet y nombres bajo `.example`, reservado por RFC 2606 §2 (D-13 = B, 2026-10-11; este spec decía antes `example.com` y sus subdominios).
- **El 53 se lista con DNS, no antes**, para no romper la escalera. Reformulada el 2026-10-11 a pedido del estudiante, con D-18: la lista de puertos 22, 80, 443, 3306 y 5432 es de `default-port` («puerto por defecto») y `well-known-ports` («puertos conocidos») es el rango de IANA de 0 a 1023.
- **Una sola prueba humana, al final del capítulo** (D-15 = B, 2026-10-11, como en el capítulo 1). Entre bloques, un revisor lee los textos: lenguaje llano, escalera de términos, rigor y la causa de cada cambio de comportamiento.
- **Herramientas y mundo (2026-10-11).** `nc` imita `ncat` 7.93 de Nmap y `dig` imita BIND 9.18, las versiones de Amazon Linux 2023 (D-5); el 04 es un `identify` con una tarjeta de clasificar, sin que viaje nada (D-6 = A); el campo «Conexión» de la caja se llama «En la red» (D-8 = A).
- **Interfaz (2026-10-11).** Un solo estándar para los avisos y los errores: la primitiva `Message`, con cuatro variantes, el aspecto «Pestaña» y `success` en verde (V18). Una regla para todo paquete: la forma dice el protocolo y un borde rojo de intruso dice el papel (V19 = B).

## El mapa que crece

El mundo es el de la oficina de Lucía tal como termina el 01-14. Cada subcapítulo parte de la solución del anterior (el 02-01 parte del 01-14: decidida 1 del plan). Los números exactos pueden ajustarse al escribir los textos; lo que no cambia es el reparto de qué aparece en cada bloque.

| Pieza | Datos | Aparece en |
|-------|-------|------------|
| La oficina del 01-14 | `tu-laptop` `192.168.1.10`, `laptop-lucia` `.11`, `laptop-marta` `.12` (con su firewall), `impresora` `.21`, `laptop-visita` `.30`, `laptop-andres` `192.168.2.15`; `router-oficina` `192.168.1.1`, `192.168.2.1` y `203.0.113.10` hacia el proveedor; `router-proveedor` `203.0.113.1`; `router-destino` `203.0.113.2`; `servidor-internet` `198.51.100.50` | todos |
| Servicios de `laptop-lucia` | su app en el puerto 3000 y su base de datos de pruebas en el 5432, escuchando en todas las IPs | 01 |
| La app de Lucía solo en `127.0.0.1` | `laptop-lucia` reinició la app con otra dirección de escucha | 03 |
| Un bloque para leer | `192.168.1.0/24`; la tarjeta de `tu-laptop` muestra su IP en 32 bits y clasifica a `impresora` y `laptop-andres` en «Dentro» y «Fuera», con un contorno en el mapa (D-6) | 04 |
| SSH y firewall de `laptop-lucia` | el servicio en el 22 y un firewall que no deja entrar nada | 05 |
| La otra oficina | LAN `10.0.0.0/16` con `router-sucursal` (`10.0.0.1`), `impresora-sucursal` `10.0.0.10` y `laptop-sucursal` `10.0.0.20`; un enlace privado `172.16.0.1` a `172.16.0.2` con `router-oficina`. `router-oficina` pierde sus rutas hacia afuera | 07 |
| Servicios de `servidor-internet` | los puertos 80 y 443, solo como números (la web es del capítulo 3) | 08 |
| `casa-lucia` | un actor de internet, `192.0.2.77`, y un reenvío fijo en `router-oficina`: `203.0.113.10:3000` va a `laptop-andres:3000` | 09 |
| Los servidores de nombres | `servidor-dns` (el resolver, `198.51.100.8`) y `servidor-autoritativo` (`198.51.100.53`, zona `lucia.example`); `tu-laptop` recibe su servidor DNS por DHCP | 10 |
| Registros con errores | `www.lucia.example` y `blog.lucia.example` apuntan a `198.51.100.51`, una IP que nadie tiene | 11 |
| El sitio se muda | `servidor-nuevo` `198.51.100.60`; `servidor-dns` guarda en caché la respuesta de antes | 12 |
| Tres fallas más | `servidor-autoritativo-noticias` (`198.51.100.54`, zona `noticias.example`, caído); una línea en el archivo hosts de `tu-laptop`; `laptop-andres` con la `impresora` como servidor DNS | 13 |
| La guardia | siete casos, cada uno un cambio sobre el mundo del 13 | 14 |

Direcciones de documentación. RFC 5737 reserva `192.0.2.0/24` (TEST-NET-1), `198.51.100.0/24` (TEST-NET-2) y `203.0.113.0/24` (TEST-NET-3) «for use in documentation» y pide que no aparezcan en internet; el juego las usa como si fueran públicas y lo dice aquí, no en pantalla. Los enlaces entre routers y la LAN de la otra oficina usan rangos privados de RFC 1918 (`172.16.0.0/12` y `10.0.0.0/8`). Nombres: RFC 2606 §2 reserva `.example` «for use in documentation or as examples» (resumen leído el 2026-10-11, sin cita literal) y el juego pone todos sus nombres bajo `.example` (D-13): `lucia.example` para el sitio de Lucía y `noticias.example` para la zona caída. `.example` no está delegado en la zona raíz hoy: no aparece en la lista de dominios de primer nivel de IANA (https://data.iana.org/TLD/tlds-alpha-by-domain.txt, versión 2026101001, 2026-10-11) y `a.root-servers.net` contestó NXDOMAIN a `www.lucia.example` ese día. Los nombres que este spec usaba antes (`example.com` y `example.org`) ya no se usan.

## Los catorce

| # | Título | Idea nueva | Términos nuevos | Qué viaja | Termina en |
|---|--------|------------|-----------------|-----------|------------|
| 01 | Un equipo, muchos servicios | El ping llega al equipo, pero lo que se usa es un servicio que escucha en un puerto (ICMP no tiene puertos). Se prueba con `nc` | servicio, puerto, puerto de destino, IP:puerto, escuchar, nc | un ping y dos `nc` a `laptop-lucia` | el ping y los dos `nc` vuelven; la pregunta separa equipo de servicio |
| 02 | Abrir una conexión | Qué hizo `nc` por dentro: el cliente elige un puerto efímero, abre en tres pasos y la respuesta vuelve a ese puerto | cliente y servidor, TCP, conexión, saludo de tres pasos, puerto de origen, puerto efímero | dos `nc` desde `tu-laptop` | se ve el saludo y los puertos invertidos de la vuelta |
| 03 | Rechazo o silencio | Tres causas de «no conecta»: nadie escucha (Connection refused), escucha solo en `127.0.0.1` (rechazo desde afuera, funciona desde el propio equipo) y un firewall que descarta (timeout) | puerto cerrado, RST, Connection refused, puerto filtrado, dirección de escucha | `nc` a un puerto sin servicio, a la app en `127.0.0.1` y a `laptop-marta` | rechazo, rechazo, silencio; se arregla la dirección de escucha |
| 04 | ¿Está en mi bloque? | Leer `192.168.1.0/24` y decir qué IPs caben | bit (apoyo), prefijo, CIDR, máscara de subred | nada (se clasifica en una tarjeta; D-6) | el bloque, su máscara, y quién cabe |
| 05 | La regla completa | Protocolo, rango de puertos y origen: abrir solo el 22, solo para un equipo (`/32`), no para todos (`0.0.0.0/0`, que en una regla significa «cualquier origen») | rango de puertos, SSH, puerto por defecto, puertos conocidos | `nc` al 22 de `laptop-lucia` desde `tu-laptop` y desde la visita | entra `tu-laptop` y la visita no |
| 06 | Tu tabla de rutas | Tu laptop decide: destino en su bloque, directo; si no, a la puerta de enlace. Esa es su tabla de rutas | ruta, tabla de rutas, ruta de red conectada, ruta por defecto | un ping dentro del piso y otro al otro piso | la caja dice qué ruta usó cada uno |
| 07 | Un camino a la otra oficina | Sin camino a `10.0.0.0/16` un router avisa; se agrega la ruta y gana por ser más específica que `0.0.0.0/0` | siguiente salto, Destination Net Unreachable (apoyo), ruta más específica | pings al servidor y a las dos IP de la otra oficina | llegan los tres |
| 08 | Una IP para toda la oficina | Sale una laptop y luego dos a la vez; comparten la IP pública y el router las distingue por puerto | NAT, traducción de puertos, tabla de traducciones (apoyo) | `nc` al puerto 80 del servidor, desde dos laptops | dos filas en la tabla con la misma IP pública |
| 09 | Desde afuera | Un paquete que llega sin traducción previa no sabe a qué equipo ir; NAT no es un firewall | reenvío de puertos (opcional) | dos `nc` desde `casa-lucia` a la IP pública | uno muere en el router; el del puerto con reenvío llega |
| 10 | Preguntar por un nombre | `dig` manda la consulta por UDP, sin saludo, al resolver de los «Ajustes de red» (que dio DHCP) | nombre de dominio, DNS, consulta DNS, resolver, UDP, dig, DHCP (apoyo) | `dig` y `ping` a `www.lucia.example` | vuelve `198.51.100.50`, en un mensaje y su respuesta |
| 11 | Los registros | El resolver busca en el servidor autoritativo; se corrige un registro A y se crea un alias (regla del CNAME) | servidor autoritativo, registro DNS, registro A, registro CNAME | `nc` por nombre y `dig` al alias | `www` apunta bien y `blog` es un alias |
| 12 | Todavía la vieja IP | El registro cambió, pero la respuesta vieja sigue en caché hasta que vence su TTL (segundos; no es el TTL de IP) | caché DNS, TTL de DNS | `dig` repetido mientras pasa el tiempo | `dig` da la IP nueva al vencer la caché |
| 13 | No resuelve | Tres fallas: el nombre no existe, el servidor falló, el resolver no contesta (Port Unreachable). Y la trampa del archivo hosts: `dig` falla mientras `ping` resuelve | NXDOMAIN, SERVFAIL (apoyo), Port Unreachable (apoyo), archivo hosts (apoyo) | cuatro `dig` y un `ping` | cada falla se ve distinta |
| 14 | Guardia: «no conecta» | 7 casos; el primero guiado con el orden ¿resuelve el nombre? ¿hay ruta? ¿contesta el puerto?; un caso es el bucle de routers del 01-09, que el jugador encuentra con traceroute y arregla | sin términos nuevos | lo que el jugador elija | nombra la causa de cada caso |

### Bloque 1 · Quién escucha (01 y 02)

- **01 · Un equipo, muchos servicios.** El ping a `laptop-lucia` vuelve, pero su app no es el ping. Con `nc` se prueba el puerto de cada servicio. La pregunta final separa «el equipo contesta» de «el servicio contesta». Denso: seis términos.
- **02 · Abrir una conexión.** Lo mismo que hizo `nc`, por dentro: el cliente elige un puerto de origen, manda un SYN, recibe un SYN-ACK y confirma con un ACK. La vuelta invierte los puertos. Denso: seis términos.

### Bloque 2 · Rechazo, bloque y regla (03, 04 y 05)

- **03 · Rechazo o silencio.** Tres pruebas con tres resultados. Quien rechaza avisa (un RST); quien descarta calla. La app que escucha solo en `127.0.0.1` es la causa que más sufre un desarrollador Node. Denso: tres causas y cinco términos.
- **04 · ¿Está en mi bloque?** Se lee `192.168.1.0/24` en una tarjeta: el bloque y su máscara, la IP de `tu-laptop` en 32 bits con el prefijo marcado, y quién cabe, clasificando a `impresora` y `laptop-andres` en «Dentro» y «Fuera». Un contorno en el mapa rodea lo que ya está dentro. Nada viaja (D-6 = A).
- **05 · La regla completa.** Una regla es protocolo, rango de puertos y origen. Se abre el 22 y solo para `tu-laptop`. El 05 presenta también el puerto por defecto y los puertos conocidos (D-18).

### Bloque 3 · Qué camino (06 y 07)

- **06 · Tu tabla de rutas.** La decisión de `tu-laptop` del 01-06, ahora con nombre y con su tabla a la vista.
- **07 · Un camino a la otra oficina.** `router-oficina` perdió sus rutas. El aviso Net Unreachable, la ruta por defecto, la ruta a `10.0.0.0/16` y cuál gana.

### Bloque 4 · Una IP, muchos equipos (08 y 09)

- **08 · Una IP para toda la oficina.** Cumple lo que el 01 anunció: «Fuera de la oficina el encabezado cambia: lo verás en el capítulo 2». Dos laptops salen a la vez con el mismo puerto de origen y `router-oficina` las separa en su tabla.
- **09 · Desde afuera.** Sin una fila, el paquete de afuera no sabe a qué equipo ir. Con una fila fija, entra a quien sea: NAT traduce, no filtra.

### Bloque 5 · Nombres (10 a 13)

- **10 · Preguntar por un nombre.** `dig` manda un solo mensaje por UDP al resolver. Denso: siete términos.
- **11 · Los registros.** El resolver pregunta al servidor autoritativo. Se corrige un registro A y se crea un alias; el CNAME no admite otros registros en su nombre.
- **12 · Todavía la vieja IP.** La caché y el TTL de DNS, con un reloj: el jugador espera y repite.
- **13 · No resuelve.** NXDOMAIN, SERVFAIL, un resolver sin servicio y la trampa del archivo hosts.

### Bloque 6 · La guardia (14)

Un solo id, `02-14`, con siete casos. El primero es guiado, con el orden de tres preguntas. Los otros seis van sin pistas y cada uno tiene una causa distinta:

| Caso | Causa | Lo que se ve |
|------|-------|--------------|
| 1 (guiado) | el servicio escucha solo en `127.0.0.1` | resuelve, hay ruta, el puerto rechaza |
| 2 | nombre mal escrito | NXDOMAIN |
| 3 | línea vieja en el archivo hosts | `dig` da la IP buena; `ping` va a otra |
| 4 | falta una ruta | Destination Net Unreachable |
| 5 | bucle entre routers (el del 01-09); el jugador lo arregla | Time Exceeded desde dos routers que se alternan |
| 6 | firewall que descarta | timeout en un solo puerto |
| 7 | el resolver no tiene servicio DNS | Port Unreachable |

## Escalera de términos

Cada término se presenta en el incidente que lo necesita, ni antes ni después, con una definición rigurosa de 120 caracteres o menos que no nombra términos que el jugador aún no conoce. Son 53: 50 ids nuevos en el registro (`src/copy/terms.ts`) y tres que ya existen y cambian de capítulo (`cidr`, `dns` y `nat`, que el registro de hoy guarda para el capítulo 4; `nat` se reescribe). Niveles: 45 núcleo, 7 apoyo y 1 opcional. Los 52 aprobados eran 49 ids nuevos y tres reescritos; el 53.º, `default-port`, lo pidió el estudiante el 2026-10-11 con D-18.

Las definiciones de la tabla son propuestas: parten de las de la investigación y cambian donde el orden aprobado las rompe. **`ladder.test.ts` decide.** El 2026-10-11 se corrió un script que repite la lógica de `namedTerms` (nombre entero, sin distinguir mayúsculas, con plural `s` o `es`) sobre las 52, contra los términos conocidos en cada incidente (los 38 del capítulo 1 más los del capítulo 2 hasta ese incidente) y contra todo el registro. (Fueron los 52 aprobados; `default-port` se sumó después y pasa el mismo test.) Resultado: las cuatro definiciones de la investigación que nombran un término posterior son `nc` (nombra TCP, del 02), `closed-port` (nombra UDP, del 10, y Port Unreachable, del 13), `route` y `default-route` (nombran «siguiente salto», del 07). Aquí van reescritas, sin mover ningún término de su subcapítulo. Con las reescritas, el script no encuentra ningún choque y la más larga mide 119 caracteres.

Otros cambios sobre la investigación:

- **`port`** dice «de 1 a 65535», no «de 0 a 65535»: IANA marca el 0 como reservado (investigación, 4.1).
- **`nat`** pierde «un router»: dice «cambia la IP privada de origen por una pública al salir de la red» para cubrir también el NAT uno a uno del Internet gateway del capítulo 4. Así el motivo `route-nat` del capítulo 4, que etiqueta `{{nat}}`, sigue diciendo la verdad sin tocar su texto.
- **`dirección de escucha`** y **`Port Unreachable`** son nuevos (no estaban en la investigación).
- **`well-known-ports`** es el rango de IANA de 0 a 1023 y pone el 22 como ejemplo (RFC 6335 §6, «System Ports, also known as the Well Known Ports»); **`default-port`** (nuevo, D-18) lista 22, 80, 443, 3306 y 5432 como costumbre. El 3306 y el 5432 son puertos por defecto y no son puertos conocidos. Ninguno de los dos lista el 53: llega con DNS (10).

| Inc. | Id | Término | Definición (máx. 120 caracteres) | Largo | Nivel |
|------|----|---------|----------------------------------|-------|-------|
| 01 | `service` | servicio | Un programa de un dispositivo que atiende los paquetes que le llegan de otros dispositivos. | 91 | Núcleo |
| 01 | `port` | puerto | Un número de 1 a 65535 que, junto con la IP, dice a qué servicio de un dispositivo va un paquete. | 97 | Núcleo |
| 01 | `listen` | escuchar | Un servicio escucha cuando espera paquetes en un puerto de una de las IPs del dispositivo. | 90 | Núcleo |
| 01 | `ip-port` | IP:puerto | La IP y el puerto juntos, como 192.168.1.40:22. Señalan un servicio concreto de un dispositivo concreto. | 104 | Núcleo |
| 01 | `destination-port` | puerto de destino | El puerto del servicio al que va el paquete. | 44 | Núcleo |
| 01 | `nc` | nc | Una herramienta de consola. nc -vz IP puerto prueba si hay un servicio escuchando en ese puerto, sin enviarle datos. | 116 | Núcleo |
| 02 | `client-server` | cliente y servidor | El cliente inicia el contacto y el servidor espera y responde. Son roles de cada intercambio, no tipos de equipo. | 113 | Núcleo |
| 02 | `tcp` | TCP | Transmission Control Protocol: abre una conexión, entrega los datos en orden y reenvía lo que se pierde. | 104 | Núcleo |
| 02 | `connection` | conexión | Un intercambio TCP entre dos IP:puerto: se abre, se usa y se cierra. | 68 | Núcleo |
| 02 | `handshake` | saludo de tres pasos | Así abre TCP una conexión: el cliente manda SYN, el servidor contesta SYN-ACK y el cliente confirma con ACK. | 108 | Núcleo |
| 02 | `source-port` | puerto de origen | El puerto desde el que sale el paquete. A ese puerto vuelve la respuesta. | 73 | Núcleo |
| 02 | `ephemeral-port` | puerto efímero | El puerto de origen que el dispositivo elige para cada intercambio nuevo. Su rango depende del sistema operativo. | 113 | Núcleo |
| 03 | `closed-port` | puerto cerrado | Un puerto donde nadie escucha. En TCP, el dispositivo lo avisa con un RST. | 74 | Núcleo |
| 03 | `rst` | RST | Un paquete TCP que dice «aquí no hay conexión». Lo manda quien recibe un SYN en un puerto donde nadie escucha. | 110 | Núcleo |
| 03 | `connection-refused` | Connection refused | El error de quien conecta a un puerto que rechaza la conexión: llegó un RST. Casi siempre, un puerto cerrado. | 109 | Núcleo |
| 03 | `filtered-port` | puerto filtrado | Un puerto cuyo tráfico descarta un firewall: nadie contesta y quien envía solo ve un timeout. | 93 | Núcleo |
| 03 | `listen-address` | dirección de escucha | La IP en la que escucha un servicio: 127.0.0.1 atiende solo al propio dispositivo; 0.0.0.0, a todas sus IPs. | 108 | Núcleo |
| 04 | `bit` | bit | La unidad mínima de datos: un 0 o un 1. Una IPv4 tiene 32 bits: cuatro números de 8 bits. | 89 | Apoyo |
| 04 | `prefix` | prefijo | Los primeros bits de una IP, iguales para todo un bloque. Los demás bits distinguen a cada dispositivo del bloque. | 114 | Núcleo |
| 04 | `cidr` | CIDR | Un bloque de IPs escrito IP/prefijo: /24 son 256 IPs; /32, una sola; 0.0.0.0/0, todas las IPv4. | 95 | Núcleo · ya en el registro |
| 04 | `subnet-mask` | máscara de subred | El prefijo escrito como una IP: los bits en 1 son la parte fija. /24 es 255.255.255.0. | 86 | Núcleo |
| 05 | `port-range` | rango de puertos | El puerto o los puertos que permite una regla: uno solo (22) o un rango (7000-8000). Va junto al protocolo. | 107 | Núcleo |
| 05 | `ssh` | SSH | Secure Shell: el servicio para manejar un servidor desde una consola remota. Escucha por costumbre en el puerto 22. | 115 | Núcleo |
| 05 | `default-port` | puerto por defecto | El puerto que usa un servicio si nadie lo cambia: 22 para SSH, 80, 443, 3306, 5432. Es costumbre: nada obliga a usarlo. | 119 | Núcleo |
| 05 | `well-known-ports` | puertos conocidos | Los puertos del 0 al 1023, que IANA reserva para servicios comunes, como el 22 de SSH. | 86 | Núcleo |
| 06 | `route` | ruta | Una instrucción de reenvío: los paquetes para un bloque de IPs van directo o a un router concreto. | 98 | Núcleo |
| 06 | `routing-table` | tabla de rutas | La lista de rutas de un dispositivo o router. Cada paquete que sale se compara con ella. | 88 | Núcleo |
| 06 | `connected-route` | ruta de red conectada | La ruta del bloque al que el dispositivo está conectado: esos paquetes se entregan directo, sin router. | 103 | Núcleo |
| 06 | `default-route` | ruta por defecto | La ruta 0.0.0.0/0: recibe lo que ninguna otra ruta cubre. Va a la puerta de enlace predeterminada. | 98 | Núcleo |
| 07 | `next-hop` | siguiente salto | La IP del router al que se entrega el paquete en el próximo paso de su camino. | 78 | Núcleo |
| 07 | `net-unreachable` | Destination Net Unreachable | Un aviso ICMP de que un router no tiene ruta a esa red. Es el par de Destination Host Unreachable. | 98 | Apoyo |
| 07 | `most-specific-route` | ruta más específica | Si varias rutas cubren un destino, gana la de prefijo más largo: /32 antes que /24, y /24 antes que 0.0.0.0/0. | 110 | Núcleo |
| 08 | `nat` | NAT | Network Address Translation: cambia la IP privada de origen por una pública al salir de la red, y lo deshace al volver. | 119 | Núcleo · ya en el registro |
| 08 | `napt` | traducción de puertos | NAT que también cambia el puerto de origen. Así muchas IPs privadas comparten una pública sin mezclarse. | 104 | Núcleo |
| 08 | `translation-table` | tabla de traducciones | La lista que guarda el router con cada IP:puerto privado y su IP:puerto público, para devolver cada respuesta. | 110 | Apoyo |
| 09 | `port-forwarding` | reenvío de puertos | Una traducción fija: lo que llega a la IP pública del router en un puerto va a un dispositivo interno. | 102 | Opcional |
| 10 | `domain-name` | nombre de dominio | Un nombre legible, como lucia.example, escrito por niveles separados por puntos. Se lee de derecha a izquierda. | 111 | Núcleo |
| 10 | `dns` | DNS | Domain Name System: el sistema que convierte un nombre de dominio en una IP. Usa el puerto 53. | 94 | Núcleo · ya en el registro |
| 10 | `dns-query` | consulta DNS | Una pregunta por un nombre. La respuesta trae su IP o dice que no existe. Suele viajar por UDP. | 95 | Núcleo |
| 10 | `resolver` | resolver | El servidor DNS al que pregunta un dispositivo. Si no conoce la respuesta, la busca por él. | 91 | Núcleo |
| 10 | `udp` | UDP | User Datagram Protocol: manda cada mensaje suelto, sin conexión ni confirmación. Si se pierde, UDP no lo reenvía. | 113 | Núcleo |
| 10 | `dig` | dig | Una herramienta de consola que hace una consulta DNS y muestra la respuesta completa, con su estado. | 100 | Núcleo |
| 10 | `dhcp` | DHCP | Dynamic Host Configuration Protocol: un servidor presta a cada dispositivo su IP, máscara, puerta de enlace y DNS. | 114 | Apoyo |
| 11 | `authoritative-server` | servidor autoritativo | El servidor DNS que guarda los registros de un dominio y da la respuesta definitiva. | 84 | Núcleo |
| 11 | `dns-record` | registro DNS | Una entrada del DNS con cuatro datos: nombre, tipo, valor y cuánto tiempo puede guardarse. | 90 | Núcleo |
| 11 | `a-record` | registro A | Un registro que asocia un nombre con una IPv4. | 46 | Núcleo |
| 11 | `cname-record` | registro CNAME | Un registro que hace de un nombre un alias de otro nombre, no de una IP. Ese nombre no puede tener más registros. | 113 | Núcleo |
| 12 | `dns-cache` | caché DNS | Las respuestas que el resolver guarda para no preguntar de nuevo, hasta que vence su tiempo de vida. | 100 | Núcleo |
| 12 | `dns-ttl` | TTL de DNS | Los segundos que una respuesta puede quedar en caché. No es el TTL de IP, que cuenta saltos. | 92 | Núcleo |
| 13 | `nxdomain` | NXDOMAIN | La respuesta del DNS «ese nombre no existe». El resolver también la guarda en caché un tiempo. | 94 | Núcleo |
| 13 | `servfail` | SERVFAIL | La respuesta del DNS «el servidor no pudo contestar». No dice si el nombre existe. | 82 | Apoyo |
| 13 | `port-unreachable` | Port Unreachable | Un aviso ICMP de que ningún programa escucha en ese puerto UDP. Es el par del RST de TCP. | 89 | Apoyo |
| 13 | `hosts-file` | archivo hosts | Un archivo del dispositivo que asocia nombres con IPs, sin usar DNS. Ahí suele estar localhost. | 95 | Apoyo |

Notas de la tabla:

- **Orden de las definiciones.** Cada una usa solo términos del mismo incidente o de uno anterior. Un ejemplo: en el 01, `nc` dice «prueba si hay un servicio escuchando en ese puerto, sin enviarle datos» y no nombra TCP. Es fiel a la opción `-z`, que en macOS «should just scan for listening daemons, without sending any data to them» (`man nc`, investigación 2026-10-10). En `ncat` 7.93, el `nc` que imita el juego (D-5), `-z` es «Zero-I/O mode, report connection status only» (`ncat_main.c`, leído el 2026-10-11): conecta y termina sin mandar datos.
- **Dos palabras del lenguaje corriente que coinciden con un término.** «Resolver» es un verbo español y un término (10), y «conexión» es el campo «Conexión» de la caja de un dispositivo del capítulo 1 y el término de TCP (02). Ninguna de las dos rompe la escalera por sí sola; el segundo choque se resolvió con D-8 (2026-10-11): el campo de la caja pasa a llamarse «En la red».
- **Ids.** Son una propuesta (inglés, kebab-case, como el registro). `terms.test.ts` exige su forma.
- **Los 53 en cifras.** 6 + 6 + 5 + 4 + 4 + 4 + 3 + 3 + 1 + 7 + 4 + 2 + 4 = 53, con el 14 sin términos. El plan lo vuelve prueba (`chapter-2.test.ts`) y tabla de cobertura.

## Lo que la simulación enseña

La simulación sigue siendo un solo motor (`src/engine/`) que calcula el resultado de cada paquete; ningún texto lo decide. Las etiquetas [fuente], [local] y [sin verificar] son las de la investigación. Lo nuevo de hoy (2026-10-11) dice «leído hoy».

- **Puerto y servicio.** Un puerto vive en el encabezado de TCP o de UDP, no en el de IP; el 0 está reservado y se usa del 1 al 65535 (IANA; RFC 6335 §6) **[fuente]**. ICMP no tiene puertos: el Echo lleva un identificador y un número de secuencia, y NAT usa ese identificador (RFC 792; RFC 3022 §2) **[fuente]**.
- **Cliente y servidor** son roles de cada intercambio, no tipos de equipo. **Puerto efímero:** lo elige el cliente y su rango cambia con el sistema (RFC 6335 §6: 49152 a 65535; kernel de Linux: 32768 a 60999; Windows desde Vista: 49152 a 65535; macOS: 49152 a 65535, **[local]**) **[fuente]**. El juego usa el 51514, que cae dentro de los rangos de IANA y de Linux, y no enseña ninguna cifra de rango.
- **Saludo de tres pasos:** SYN, SYN-ACK, ACK (RFC 9293 §3.5). Una conexión es un par de extremos, cada uno IP y puerto (RFC 9293 §4) **[fuente]**.
- **Cerrado y filtrado.** Un TCP sin servicio contesta RST (RFC 9293 §3.10.7.1) y quien conecta ve «Connection refused»; un firewall que descarta no contesta y quien conecta ve un timeout **[fuente]**; `nc -vz 127.0.0.1 9` dio «Connection refused» y `nc -vz -w 3 -G 2 10.255.255.1 80` dio «Operation timed out» **[local]**. **UDP cerrado:** «UDP SHOULD send an ICMP Port Unreachable message» (RFC 1122 §4.1.3.1); Linux limita esos avisos a uno por segundo por destino (`icmp_ratelimit`) **[fuente]**. El motor de hoy calla ante todo UDP (`host-udp-no-service`): es un desajuste, no una regla. El plan lo corrige (decidida 9) y revisa si eso toca el test dorado del capítulo 4 (D-1).
- **Dirección de escucha.** Con `INADDR_ANY` el socket queda «bound to all local interfaces» (`ip(7)`) **[fuente]**; Node, sin `host`, escucha en `::` o en `0.0.0.0` **[fuente]**. Un servicio ligado a `127.0.0.1` solo recibe paquetes cuyo destino es `127.0.0.1`: desde otro equipo, y también desde el propio equipo hacia su IP de la red, el sistema contesta con un RST (razonamiento a partir de `ip(7)`, sin prueba local; el plan lo marca como **[sin verificar]** hasta que el estudiante lo pruebe en un EC2).
- **CIDR.** `IP/prefijo` con el prefijo de 0 a 32 bits; un `/24` son 256 direcciones, no 256 equipos; `/32` es una sola IP (RFC 4632 §3.1) **[fuente]**. `0.0.0.0/0` es «cualquier origen» en una regla y la «ruta por defecto» en una tabla de rutas, que «MUST be accepted by all implementations» (RFC 4632 §5.1) **[fuente]**. `172.16.0.0/12` cubre de `172.16` a `172.31`, no es un `/16` (RFC 1918 §3) **[fuente]**.
- **Rutas.** Un dispositivo decide con su tabla: la red conectada se entrega directo y lo demás va a la puerta de enlace (RFC 1122 §3.3.1.1, ya del capítulo 1). Si varias rutas cubren el destino, gana la de prefijo más largo: «Forwarding in the Internet is done on a longest-match basis» (RFC 4632 §5.1) **[fuente]**. Un router sin ninguna ruta que cubra el destino «may send» el aviso Destination Net Unreachable (tipo 3, código 0; RFC 792), y el `ping` de Linux escribe «Destination Net Unreachable» (iputils) **[fuente]**. AWS no dice «siguiente salto»: dice Destination y Target; la equivalencia queda para el capítulo 6.
- **NAT.** El NAT tradicional es de direcciones y puertos (NAPT): el ejemplo del RFC 3022 traduce `10.0.0.10:3017` a `138.76.28.4:1024` **[fuente]**. Con TCP y con UDP el mapeo debe ser independiente del destino: «A NAT MUST have an "Endpoint-Independent Mapping" behavior for TCP» (RFC 5382 REQ-1, leído hoy) y lo mismo para UDP (RFC 4787 REQ-1, leído hoy). Un SYN que llega de afuera sin traducción: «A NAT MUST NOT respond to an unsolicited inbound SYN packet for at least 6 seconds», y pasado ese plazo «the NAT SHOULD send an ICMP Port Unreachable error», salvo que la política mande descartarlo en silencio (RFC 5382 REQ-4 y REQ-4a, leídos hoy). El NAT no da seguridad por sí solo: «The act of translating address bits within the header does not provide security in itself» (RFC 4864 §2.2) **[fuente]**. Una fila fija a mano es un reenvío de puertos: «static address maps» (RFC 3022 §2) **[fuente]**.
- **DNS.** La consulta suele ir por UDP al puerto 53 y la respuesta no pasa de 512 bytes sin EDNS(0) (RFC 1035 §4.2.1; RFC 6891 §6.2.3); un servidor y un resolver DEBEN aceptar también TCP (RFC 7766 §5; RFC 9210 §3). El TTL es un máximo, no una orden (RFC 2181 §8). «If a CNAME RR is present at a node, no other data should be present» (RFC 1034 §3.6.2), exacto en RFC 2181 §10.1: por eso la raíz de la zona no admite CNAME y Route 53 ofrece Alias (capítulo 17). NXDOMAIN es el RCODE 3 y se guarda en caché (RFC 2308) **[fuente]**. El juego modela el SOA de cada zona como dato (los siete campos de RFC 1035 §3.3.13, con valores fijos del juego) y un NXDOMAIN lo trae en la sección de autoridad, con el TTL de RFC 2308 §3: «The TTL of this record is set from the minimum of the MINIMUM field of the SOA record and the TTL of the SOA itself» (texto leído el 2026-10-11) **[fuente]**. `dig` no lee el archivo hosts; `ping` sí: `dig localhost` dio NXDOMAIN mientras `ping localhost` resolvió **[local]**.
- **Las herramientas, como las imprime su código** (D-5; leído el 2026-10-11). `nc` es `ncat` 7.93 de Nmap (`ncat/ncat_connect.c`, `ncat_main.c` y `util.c`): con `nc -vz -w 3`, todo va a stderr con el prefijo `Ncat: `. Abierto: `Ncat: Version 7.93 ( https://nmap.org/ncat )`, `Ncat: Connected to <ip>:<puerto>.` y `Ncat: 0 bytes sent, 0 bytes received in 0.01 seconds.`; cerrado: `Ncat: Connection refused.`; tiempo agotado: `Ncat: TIMEOUT.` (en 7.70 el código imprimía el texto de `ETIMEDOUT`; desde 7.80, `TIMEOUT`). No lleva `[tcp/...]`. El texto «Connection refused» lo da la libc del sistema (`socket_strerror`), no `ncat`. `dig` es de BIND 9.18 (`bin/dig/dig.c` y `dighost.c` de bind-9.18.50): «;; ->>HEADER<<- opcode: %s, status: %s, id: %u»; con un tiempo agotado, una línea «;; communications error to <ip>#53: timed out» por intento y, al final, «;; no servers could be reached», con la línea de comando de `dig` entre las dos; «timed out» y «connection refused» salen de `isc_result_totext` (`lib/isc/result.c`, 9.18.50) y `UV_ECONNREFUSED` se traduce a «connection refused» (`uverr2result.c`, leído antes en 9.18.28; en 9.18.50 queda por releer). **En BIND 9.16.48 el tiempo agotado se escribía distinto:** «connection timed out; no servers could be reached» (`dighost.c`, 9.16.48, leído el 2026-10-11). Por eso la versión es la decisión D-5. **En macOS el `nc` es otro programa** y imprime otra cosa: el 2026-10-11, `nc -vz -w 3 127.0.0.1 9` dio `nc: connectx to 127.0.0.1 port 9 (tcp) failed: Connection refused` y `nc -vz -w 3 -G 2 10.255.255.1 80` dio `nc: connectx to 10.255.255.1 port 80 (tcp) failed: Operation timed out` **[local]**; el caso abierto no se probó.

### Simplificaciones declaradas

| Simplificación | Por qué |
|----------------|---------|
| `traceroute -I` sigue enviando Echo Request, no UDP | El capítulo 1 lo justificó con «UDP y los puertos son del capítulo 2». Ahora se podría cambiar, pero cambiaría las trazas y los textos del capítulo 1 (D-16, decidida el 2026-10-11: se queda) |
| Los números del NAT son del juego: puertos públicos desde el 40001, sin conservar el puerto de origen | El ejemplo del RFC 3022 también cambia el puerto (3017 a 1024). Otros NAT eligen otros números |
| Una fila del NAT no tiene tiempo de vida ni límite, y el ping sale sin fila | RFC 4787 REQ-5 pide que una fila UDP no expire en menos de 2 minutos; el agotamiento de puertos y el identificador de ICMP quedan ocultos y se dice |
| Un paquete de afuera sin traducción se descarta en silencio | RFC 5382 REQ-4 permite, tras al menos 6 segundos, un ICMP Port Unreachable. Con `nc -w 3` el cliente se rinde antes de esos 6 segundos, así que ve un timeout |
| El paquete que viene de afuera entra por la IP pública de `router-oficina` | El camino por internet entre `casa-lucia` y la oficina no se modela ni se dibuja |
| El resolver «busca por ti» | La cadena raíz, TLD, autoritativo, y la pregunta del resolver al autoritativo, no son paquetes del mapa; si el autoritativo está caído, el resolver contesta SERVFAIL |
| Los servidores DNS escuchan en el puerto 53 de TCP y de UDP, y ninguna consulta usa TCP | Un servidor DEBE aceptar los dos (RFC 7766 §5); una consulta que no cabe en UDP queda para el capítulo 17 |
| El TTL de los registros es 300 segundos y el resolver lo obedece | Son números del juego. El reloj solo corre cuando el jugador espera |
| UDP cerrado siempre avisa, sin límite de tasa | Linux limita a uno por segundo por destino |
| El resolver no guarda NXDOMAIN en caché | RFC 2308 describe cómo se guarda una respuesta negativa (investigación, 4.1); la definición de `nxdomain` lo dice en general y el juego solo cachea respuestas con registro |
| La batería de sondas no ve un rango de puertos fuera de 22, 80, 443, 3306 y 5432 | Las fichas del 05 solo ofrecen rangos que contienen alguno de esos puertos |
| El puerto de origen es 51514 y sube de uno en uno por cada conexión nueva del mismo dispositivo | Es un número del juego dentro de los rangos de IANA y de Linux; los sistemas reales eligen al azar |
| El resolver de una oficina es un servidor de internet que presta DHCP, no el router | Es lo que muestran los «Ajustes de red»; el router como reenviador DNS queda fuera |
| La tabla de rutas de un dispositivo no tiene métricas, interfaces ni protocolos | Alcanza para destino, ruta más específica y siguiente salto |
| Las salidas de `nc` y de `dig` imitan `ncat` 7.93 y BIND 9.18 y no repiten todas las líneas del encabezado | D-5. Cada línea que se imprime está citada a su fuente en un test |
| Los siete campos del SOA de cada zona son números del juego | Un NXDOMAIN real trae el SOA de la zona; el serial, los tiempos de refresco y el MINIMUM del juego son fijos y ficticios, y el TTL de la respuesta negativa sigue RFC 2308 §3 |

## Lo que el capítulo 2 hereda del capítulo 1

1. **El capítulo 1 sí muestra un paquete con IP privada llegando al servidor de internet.** En el 01-08, el 01-09, el 01-10 y el 14 un ping de `192.168.1.10` llega a `198.51.100.50` y su Echo Reply vuelve a `192.168.1.10`. La caja lo rotula «Encabezado (en tu red local)» y añade «Fuera de la oficina el encabezado cambia: lo verás en el capítulo 2». Ningún paso ni motivo nombra NAT (la prueba `the trip out of the office has no step and no reason that names NAT or the public IP` lo guarda). **No hace falta corregir el capítulo 1:** la nota ya declara la deuda. El 08 la paga. El modelo: el NAT existe siempre en el borde de la oficina, se deriva de la topología y entra en la traza como un campo aparte, sin pasos nuevos; el 08 hace que la vista lo muestre (decidida 3 del plan). Cambiar el mundo del 08 con una acción «ahora hay NAT» sería inexacto, porque el capítulo 1 habría mostrado tráfico imposible.
2. **La nota del encabezado entre el 02-01 y el 02-07.** Dice «en el capítulo 2» mientras el jugador ya está en el capítulo 2. Se deja como está (decidida 15): el 08 es el próximo incidente que toca el encabezado.
3. **El bucle que el jugador arregla.** El D-13 del capítulo 1 anotó que en el capítulo 2 el jugador vería las tablas de rutas y arreglaría un bucle él mismo. Es el caso 5 del 14.
4. **`traceroute -I`** (D-16 abierto).
5. **Ninguna razón para la respuesta.** El capítulo 1 no dice por qué un firewall deja pasar la respuesta de un ping, porque la razón real es «stateful» (capítulo 4). Con TCP, UDP y NAT pasa lo mismo: ningún texto del capítulo 2 usa «stateful» ni da otra razón («recuerda la conversación», «vuelve por el mismo camino»). Una prueba lo guarda, igual que la del capítulo 1.
6. **Un router que no se dibuja no se nombra.** Vale para cada lista `shown` del capítulo 2 (en el 07 se dibujan los tres routers que ese incidente nombra).
7. **El 01-05 ya tiene el firewall de `laptop-marta`** (visible desde el 01-11). El 02-03 lo usa como el puerto filtrado.
8. **Las tarjetas ya están en estilo B** y la primitiva `Tabs` existe; no se reabre.

## Base de investigación

La investigación del 2026-10-10 sigue vigente y es la base de todo lo no listado aquí; sus fuentes están en [su sección 8](../research/2026-10-10-follow-the-packet-chapter-2-concepts.md). Lo nuevo de hoy, 2026-10-11:

| Dato | Fuente |
|------|--------|
| Salida de `ncat` 7.93: el prefijo `Ncat: `, `Version`, `Connected to`, los bytes, `Connection refused.` y `TIMEOUT.` | `ncat/ncat_connect.c`, `ncat_main.c` y `util.c` de nmap-7.93, descargado y leído el 2026-10-11; `TIMEOUT` frente al texto de `ETIMEDOUT` en nmap-7.70 y nmap-7.80, de la misma fecha |
| Salida de `dig` en 9.18.50 y en 9.16.48 | BIND 9, `bin/dig/dig.c` (el encabezado) y `bin/dig/dighost.c` (los mensajes `communications error to`, `no servers could be reached` y, solo en 9.16, `connection timed out; no servers could be reached`) de bind-9.18.50 y, de la lectura anterior, de 9.16.48; copias descargadas y leídas el 2026-10-11 |
| «timed out» y «connection refused» como texto de `isc_result_totext`; `UV_ECONNREFUSED` a `ISC_R_CONNREFUSED` | `lib/isc/result.c` de bind-9.18.50 (leído el 2026-10-11) y `lib/isc/netmgr/uverr2result.c` (9.18.28, de la lectura anterior; sin releer en 9.18.50) |
| REQ-1, REQ-4 y REQ-4a de RFC 5382 (TCP); REQ-1, REQ-5 y REQ-8 de RFC 4787 (UDP) | https://www.rfc-editor.org/rfc/rfc5382.txt y https://www.rfc-editor.org/rfc/rfc4787.txt, vía consulta con resumidor; las frases entre comillas son las que devolvió |
| `.example` «is recommended for use in documentation or as examples» | RFC 2606 §2, vía consulta con resumidor (resumen, no cita literal) |
| `.example` no está delegado en la zona raíz | https://data.iana.org/TLD/tlds-alpha-by-domain.txt, versión 2026101001 (actualizada el 2026-10-11 a las 07:07 UTC): entre `EVENTS` y `EXCHANGE` no hay `EXAMPLE`; y `dig +norec www.lucia.example @a.root-servers.net` dio NXDOMAIN con la marca `aa` (2026-10-11) |
| `invalid.` da NXDOMAIN inmediato | RFC 6761 §6.4, vía consulta con resumidor: es un **resumen**, no una cita literal |
| Un NXDOMAIN autoritativo trae el SOA de la zona, y su TTL es el menor entre el MINIMUM y el TTL del propio SOA | RFC 2308 §3, texto leído en https://www.rfc-editor.org/rfc/rfc2308.txt el 2026-10-11 |
| TEST-NET-1, TEST-NET-2 y TEST-NET-3 «are provided for use in documentation» y «SHOULD NOT appear on the public Internet» | RFC 5737 §3 y §4, vía consulta con resumidor |
| El test dorado del capítulo 4 guarda 81 trazas, todas con `"protocol":"icmp"`, y ninguna con `udp` | `grep` sobre `src/levels/04-iaas/golden-traces.json`, hoy |
| Qué traen Amazon Linux 2023 y Amazon Linux 2 | Amazon Linux 2023: `nc` es `ncat` 7.93 (paquete `nmap-ncat`, que no viene en la AMI estándar) y `dig` es de BIND 9.18 (el repositorio trae la 9.18.50); es un dato de la sesión principal del 2026-10-11 que **no se volvió a consultar al escribir esto**. Amazon Linux 2: `nmap-ncat` 6.40 y `bind-utils` hasta la 9.11.4 (metadatos del repositorio, `primary.xml`, descargados el 2026-10-11); el juego no los imita |

La **demo de NXDOMAIN usa un subdominio inexistente de `lucia.example`** (`noexiste.lucia.example`), no un nombre bajo `.invalid`: RFC 6761 §6.4 manda que un resolver conteste `invalid.` al instante sin preguntar a nadie, y eso ocultaría justo el camino resolver a autoritativo que enseñan el 11 y el 13.

### Sin verificar

Lo siguiente **no** se pudo comprobar en una fuente primaria. El juego no lo afirma como hecho.

- **Qué trae Amazon Linux 2023.** Es un dato de la sesión principal (2026-10-11): `nc` es `ncat` 7.93 y `dig` es de BIND 9.18 (el repositorio trae la 9.18.50). No se volvió a consultar al escribir esto ni se comprobó en un EC2; el estudiante puede confirmarlo con `nc --version` y `dig -v` (D-5).
- **El texto «Connection refused» de `ncat`.** Lo da la libc del sistema (`socket_strerror`); la libc de Amazon Linux no se leyó.
- **Que el kernel entregue `ECONNREFUSED` a `dig` tras un ICMP Port Unreachable en UDP.** El código de `dig` traduce el error a «connection refused»; el paso del kernel (`udp(7)`) no lo leí.
- **Cuántos intentos hace `dig`.** Cada intento fallido imprime una línea `communications error`; el número sale de `resolv.conf` y, si vale 0, `dig` usa 3 (`dighost.c`, líneas 1319 a 1324). El valor por defecto de esa lectura (`irs_resconf_getattempts`, en `lib/irs`, que la copia descargada no trae) no se leyó; el juego imprime tres.
- **Las secciones `;; QUESTION SECTION:` y `;; ANSWER SECTION:` de `dig`** (en `lib/dns/message.c`) y la traducción de `UV_ECONNREFUSED` (`uverr2result.c`) en 9.18.50: no están en la copia descargada. La Tarea 18 las lee antes de imprimir nada y lo que no confirme no se imprime.
- **Que `dig` no lea el archivo hosts en Amazon Linux,** y el orden de hosts y DNS allí (la investigación ya lo marcó).
- **Que un servicio ligado a `127.0.0.1` rechace también las conexiones hacia la IP de la red hechas desde el propio equipo.** Razonamiento a partir de `ip(7)`; el estudiante puede probarlo en un EC2 y, si no lo hace, queda «sin verificar» en la guía del motor.
- **Cuántos NAT reales conservan el puerto de origen.** El juego no lo conserva y lo declara.
- **El texto exacto de `ip route`.** La tabla del juego usa nombres de columna propios y no imita ese comando.
- **Lo que la investigación ya dejó sin verificar** (objetivos de Network+, vigencia de SAA-C03, `/31`, HTTP/3, cachés del navegador): sigue igual.

## Fuera del capítulo

- HTTP, URL, cabeceras, TLS y certificados (capítulo 3). Los puertos 80 y 443 son solo números.
- «Con estado» y «sin estado», y la network ACL (capítulos 4 y 6). Rangos efímeros por sistema (6).
- Subnet como componente de AWS, tablas de ruta de una VPC (Destination y Target), Internet gateway como ruta y NAT gateway (6). Route 53, zonas alojadas, Alias, políticas y health checks (17). Nombres DNS de la instancia y resolver de la VPC (4).
- Registros AAAA, MX y TXT; DNSSEC; DNS por TCP en una consulta real; la cadena raíz, TLD, autoritativo. (NS y SOA sí existen como datos de cada zona: el SOA lo imprime un NXDOMAIN, pero el jugador no los edita.)
- IPv6; MAC, ARP, switch; VPN, peering y GRE (12); balanceadores (7).
- Cierre de una conexión TCP (FIN), reenvíos y ventanas; el límite de tasa de los avisos ICMP; los tiempos de vida de las filas del NAT.
- Otros puertos (3389, 2049, 123, 25): llegan con su servicio.
- Que el jugador cree filas del NAT a mano (la fila fija del 09 viene dada; D-14).
- Reglas de salida con puertos en el Security Group (capítulo 4).

## Decisiones abiertas

Las dieciocho se contestaron el 2026-10-11 (D-12 y D-17, antes de ese día). Las opciones, la recomendación y el porqué de cada una están en el plan (`docs/plans/2026-10-11-follow-the-packet-chapter-2.md`, sección «Decisiones abiertas»). Lo elegido:

- **D-1.** Test dorado del capítulo 4: A, no regenerar.
- **D-2.** A: movimientos nuevos dentro de `send`, no una mecánica nueva.
- **D-3.** A: una primitiva `Table`.
- **D-4.** A: una tarjeta «Salida» que generaliza la de traceroute (V11 = B: la salida de `dig` se imprime completa y se pliega).
- **D-5.** `nc` imita `ncat` 7.93 de Nmap y `dig` imita BIND 9.18, las versiones de Amazon Linux 2023: la antigua B, reformulada con el dato nuevo, y no la recomendación original (OpenBSD `nc`). La subpregunta sobre `tcp` en la salida ya no aplica: la salida de `ncat` no lleva `[tcp/...]`.
- **D-6.** A: el 04 es un `identify` con una tarjeta de clasificar, y nada viaja (segunda excepción a «algo viaja»).
- **D-7.** A: reescribir cuatro definiciones en vez de mover términos.
- **D-8.** A: el campo «Conexión» de la caja pasa a llamarse «En la red». Solo existe en la caja de un dispositivo de una oficina (capítulos 1 y 2); el capítulo 4 no lo tiene.
- **D-9.** B, no la recomendación: una forma propia para TCP y otra para UDP.
- **D-10.** A: los servidores DNS son piezas del mapa.
- **D-11.** A: un reloj explícito con el movimiento `wait` (V16 = C: la tarjeta «Reloj del juego»).
- **D-12.** A: el jugador arregla el bucle del caso 5 (antes del 2026-10-11).
- **D-13.** B, no la recomendación: todos los nombres del juego bajo `.example` (`lucia.example` y `noticias.example`).
- **D-14.** A en las dos partes: descarte silencioso del paquete de afuera sin traducción; reenvío dado por el mundo.
- **D-15.** B, no la recomendación: una sola prueba humana, al final, con un revisor de textos por bloque.
- **D-16.** A: `traceroute -I` se queda.
- **D-17.** A: construir los catorce y separar solo si la prueba humana del capítulo entero lo pide (antes del 2026-10-11).
- **D-18.** B: dos términos en el 05, `default-port` («puerto por defecto») y `well-known-ports` («puertos conocidos») como el rango de IANA de 0 a 1023.

Las decisiones visuales que abrieron después las tareas de interfaz también están cerradas (2026-10-11): **V18,** la primitiva `Message` con cuatro variantes, el aspecto «Pestaña» y `success` en verde; **V19 = B,** una regla para todo paquete: la forma dice el protocolo y un borde rojo de intruso dice el papel, de modo que el rombo del intruso desaparece en los capítulos 1 y 4. No queda ninguna decisión abierta.

## Riesgos

- **Densidad del 01, el 02, el 03 y el 10.** Seis, seis, cinco y siete términos. Son los primeros en separarse tras la prueba humana del capítulo entero. Separar un incidente corre los ids siguientes, sin costo: este capítulo no deja progreso que conservar.
- **El capítulo entero se siente largo.** Veintiocho subcapítulos (catorce más catorce) antes del 04-01. Cada uno es corto por diseño y hay una prueba humana al final, con un revisor de textos por bloque; si alguno sobra, se fusiona con el vecino.
- **Ocho huecos del motor y estado nuevo.** Puertos, servicios, UDP, tablas de rutas, NAT, DNS, reloj y secuencia. El riesgo es tocar lo que ya funciona: el test dorado del capítulo 4, las trazas del capítulo 1 y las pruebas con nombre de ambos. Cada tarea de motor repite `git diff --exit-code src/levels/04-iaas/golden-traces.json` y corre las pruebas del capítulo 1 sin editarlas, salvo las que el plan lista como cambio a propósito.
- **Las salidas de las herramientas dependen de la versión.** Una línea copiada de la fuente de otra versión engaña. Cada línea de `nc` y de `dig` queda en un test con su fuente.
- **Un mapa con más piezas.** El 07, el 09 y el 10 dibujan routers, actores y servidores nuevos. Las pruebas de geometría de Playwright del capítulo 1 se amplían a esos incidentes.
- **`src/design/primitives/` llegaba al tope de 12 archivos** con `Table` (D-3). El estudiante aprobó el 2026-10-11 partirla por familias (`card`, `tabs` y `table` viven en `panels/`), con lo que queda margen para `Message` (V18).
- **El NAT derivado de la topología es una regla del modelo, no una configuración.** Si un capítulo futuro quiere un router con NAT apagado, necesitará un campo de configuración. Hoy el modelo no lo necesita y el capítulo 1 no cambia.
