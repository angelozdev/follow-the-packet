# Sigue el paquete: capítulo 1 «Tu primer día» en catorce subcapítulos

Fecha: 2026-10-10 · Estado: los 14 subcapítulos, las decisiones y lo que queda fuera los aprobó el estudiante el 2026-10-10. Ese mismo día decidió también lo que el plan dejaba abierto (D-1 a D-10, abajo); solo la elección visual (D-6) sigue abierta, en el plan.

Sustituye los cuatro incidentes del capítulo 1 (01-01 a 01-04) que describe `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`: su sección «Capítulo 1» (mundo e incidentes) y el riesgo «Primer día lento». De aquel spec sigue valiendo todo lo demás: el catálogo de entidades, el modelo genérico, la mecánica `send`, la escalera de términos, el progreso y desbloqueo, y las reglas de copia. Plan de implementación: `docs/plans/2026-10-10-follow-the-packet-chapter-1-fourteen.md`.

El capítulo sigue siendo el 1, de nivel 0 («Bases»), con el título «Tu primer día» y la carpeta `src/levels/01-first-day/`.

## Por qué catorce

- **Cuatro incidentes cargaban demasiado.** El 01-01 presentaba seis términos a la vez (dispositivo, red, dirección IP, IPv4, paquete y ping) y el 01-03 mezclaba internet, router e IP privada. El estudiante no tiene base de redes (`rigorous-plain-copy`) y su memoria de sesiones anteriores dice que se pierde con la densidad técnica y que predecir sin método lo frustra; por eso el juego no pide predecir.
- **El capítulo 4 da por sabidos conceptos que el capítulo 1 no cubría.** Ni el salto, ni el TTL, ni la puerta de enlace, ni la diferencia entre silencio y aviso, ni que un firewall descarta sin avisar, ni la dirección de una regla.
- **Cada subcapítulo es una sola idea** (o un par inseparable), así que cada uno cabe en una pantalla de lectura y en una pregunta.

## Reglas de cada subcapítulo

1. Trae una idea nueva, o un par inseparable.
2. Algo viaja y termina en «llegó» o «murió por X». Única excepción declarada: el 01, donde todavía no existe el término «paquete» (decisión D-2: la mecánica `identify`).
3. Solo usa términos de subcapítulos anteriores. El texto de una pieza, de una ficha, de un motivo y de un sello cuenta como texto.
4. Una sola pregunta de explicación por incidente, atómica, con tres opciones y una correcta. Cada opción incorrecta refleja un error real.
5. No hay predicciones. Lo que un subcapítulo quiere que el jugador anticipe se pregunta al final, en la explicación a Lucía. Así lo decidió el estudiante: «NO quiero predecir. Me gusta explicar a Lucía al final.»

## Decisiones del estudiante (2026-10-10)

- El firewall del capítulo 1 **nunca bloquea la respuesta.** No se enseña «stateless» antes del Security Group stateful del capítulo 4 ni de la NACL stateless del 6.
- **Ningún caso usa «equipo apagado» como causa de un timeout.** En una red local, una IP sin dueño da un aviso de la propia laptop, y el texto exacto cambia entre Linux, macOS y Windows.
- **Red local sin máscara.** La regla viene dada («aquí la red es 192.168.1.x»). CIDR es del capítulo 2.
- **Cómo sale el paquete de la oficina (NAT) es una caja negra** hasta el capítulo 2. Ningún texto de este capítulo nombra NAT.
- **Fuera del capítulo:** puerto, TCP, UDP, CIDR y máscara, tabla de rutas, NAT y DNS (capítulo 2); cliente/servidor y HTTP (3); stateful y stateless (4 y 6); MAC, ARP, switch e IPv6.
- **Riesgo declarado:** el 03 y el 12 son los más densos. Si la prueba humana los siente pesados, son los primeros en separarse.

Decididas después, sobre lo que el plan dejó abierto (cada una con su número D-n del plan):

- **D-1. Ninguna migración del progreso.** Todo el progreso guardado se resetea, también el del capítulo 4: «Estamos creando. Todo se puede resetear.» La clave de almacenamiento cambia y la vieja se borra; no se copia ninguna estrella.
- **D-2. El 01 usa la mecánica `identify`** (marcar un dispositivo y elegir una IP): nada viaja en el 01.
- **D-3. La impresora de otra oficina es `10.0.0.10`.** La IP del diseño aprobado, `192.168.1.10`, está en la red del jugador y es la de `tu-laptop` en el mundo de hoy, así que un ping a ella no saldría de la red local.
- **D-4. El 14 es un solo id con siete casos.** El caso guiado y el tercero comparten la causa «sin puerta de enlace», a propósito.
- **D-5. `public-ip` se conoce desde el 04-01**, y la caja de inspección del capítulo 4 muestra las IP públicas.
- **D-7. `solicitud` y `respuesta` dejan de ser términos;** `tráfico` se queda y se presenta en el 11.
- **D-8. «Host» es un alias en la definición de dispositivo,** no un término.
- **D-9. Sin predicciones.** «NO quiero predecir. Me gusta explicar a Lucía al final.» Lo que el 03, el 06 y el 09 iban a predecir pasa a su pregunta de explicación final.
- **D-10. La terminal muestra la sintaxis de Linux:** `ping -t 3 <ip>` y `traceroute -I <ip>` (el traceroute del juego usa ICMP Echo). En el Mac del estudiante `-t` es un tiempo límite y el TTL se fija con `-m`; las instancias EC2 de los labs sí son Linux.

## El mapa que crece

La oficina de Lucía, cada incidente parte del mundo del anterior. Los números exactos pueden ajustarse al escribir los textos; lo que no cambia es el reparto de qué aparece en cada bloque.

| Pieza | Datos | Aparece en |
|-------|-------|------------|
| Piso 1, red local | «aquí la red es 192.168.1.x» | 01 |
| `tu-laptop` | `192.168.1.10` | 01 |
| `laptop-lucia` | `192.168.1.11` | 01 |
| `laptop-marta` | `192.168.1.12` | 01 (su firewall llega en el 05 y no se ve hasta el 11) |
| `impresora` | `192.168.1.21` (las cifras de `laptop-marta` invertidas, para que un destino mal escrito llegue a otro equipo) | 01 |
| `laptop-visita` | `192.168.1.30`, sin cable en el 01 y conectada desde el 02 | 01 |
| IP sin dueño | `192.168.1.50`, la que ningún equipo tiene | 05 |
| Piso 2, otra red local | `192.168.2.x`; `laptop-andres` en `192.168.2.15` | 06 |
| `router-oficina` | `192.168.1.1` (puerta de enlace del piso 1), `192.168.2.1` (piso 2) y su salida a internet | 06 |
| Proveedor y camino a internet | dos routers más y un servidor que contesta ping, con direcciones de documentación (RFC 5737) | 08 |
| Impresora de otra oficina | `10.0.0.10`, una IP privada que no usa esta oficina (D-3) | 08 |
| Un bucle entre dos routers | dado por el mundo; el jugador no configura rutas | 09 |
| Un tramo roto, sin aviso | detrás de un router | 10 |
| Firewall de `laptop-marta` visible | descarta sin avisar | 11 |
| Firewall de `tu-laptop` con regla de salida | | 13 |

Direcciones de documentación (RFC 5737): `192.0.2.0/24`, `198.51.100.0/24` y `203.0.113.0/24` están reservadas «para uso en documentación» y no deben aparecer en internet. El juego las usa como si fueran públicas y lo dice en las notas del plan, no en pantalla.

## Los catorce

| # | Título | Idea nueva | Términos nuevos | Qué viaja | Termina en |
|---|--------|------------|-----------------|-----------|------------|
| 01 | La oficina | Una red es un conjunto de dispositivos conectados, cada uno con su IP | red, dispositivo (host), dirección IP (IPv4) | nada (se marca y se elige) | marcas la que no está en la red y eliges la IP de la impresora |
| 02 | El sobre | Un paquete lleva un encabezado con IP de origen e IP de destino | paquete, encabezado, IP de origen, IP de destino | un paquete armado por ti | llega a la impresora; con el destino mal escrito llega a otro equipo |
| 03 | ¿Estás ahí? | El ping son dos mensajes y la respuesta invierte origen y destino | protocolo, ICMP, ping, Echo Request, Echo Reply | el ping a la impresora, ida y vuelta | vuelve la respuesta |
| 04 | Ping a ti mismo | Una IP que siempre eres tú, y cuánto tarda un viaje | loopback, localhost, RTT | un ping a `127.0.0.1` y otro a la impresora | los dos vuelven; el primero casi sin tiempo |
| 05 | Cuando no vuelve | Silencio frente a aviso | timeout, Destination Host Unreachable | dos pings que no vuelven | silencio (`laptop-marta`) o aviso de tu propia laptop (IP sin dueño) |
| 06 | Tu red y el router | Lo que sale de tu red local pasa por el router | red local (LAN), router | un ping dentro del piso y otro al otro piso | los dos vuelven; uno directo y otro por el router |
| 07 | A quién mandas lo de afuera | Sin puerta de enlace, tu laptop no saca nada de su red | puerta de enlace predeterminada | un ping al otro piso desde una laptop sin puerta de enlace | no sale; tras configurarla, vuelve |
| 08 | La red de redes | Internet no enruta las IP privadas | internet, IP privada, IP pública | un ping al servidor de internet y otro a la impresora de otra oficina | el primero vuelve; el segundo muere en el camino |
| 09 | Contar saltos | Cada router resta 1 al TTL; en 0 lo descarta y avisa | salto (hop), TTL, Time Exceeded | pings con TTL elegido en un bucle entre dos routers | Time Exceeded desde el router que lo tiró |
| 10 | Ver el camino | traceroute enseña cada router del camino | traceroute | un ping que se pierde y un traceroute | el último router que contesta marca dónde se corta |
| 11 | El guardia | Un firewall descarta sin avisar | firewall, tráfico, descartar (drop) | el ping a `laptop-marta` del 05 | muere en su firewall, sin aviso |
| 12 | Tu primera regla | Todo lo que ninguna regla permite queda denegado | regla, permitir, denegar, denegación por defecto, mínimo privilegio | el ping de soporte y el de una visita | entra solo el de soporte |
| 13 | Entrar y salir | Una regla vale para entrada o para salida | entrada (inbound), salida (outbound) | un ping que tu propia laptop no deja salir | sale con una regla de salida |
| 14 | Guardia final | Diagnosticar sin pistas | ninguno | los pings que tú elijas, en siete casos | nombras la causa de cada caso |

### Bloque 1 · Dónde estás (01 y 02)

- **01 · La oficina.** Ves los equipos del piso 1, marcas cuál no está en la red (`laptop-visita` sin cable), encuentras la IP de la impresora entre tres y descartas una inválida (`192.168.1.300`: un número pasa de 255). No viaja nada: el término «paquete» llega en el 02.
- **02 · El sobre.** Armas un paquete de tu laptop a la impresora y ves su encabezado. Con el destino mal escrito llega a `laptop-marta`, no a la impresora.

### Bloque 2 · El ping (03, 04 y 05)

- **03 · ¿Estás ahí?** Primer ping a la impresora. Lucía pregunta al final qué origen y qué destino lleva la respuesta: están invertidos (RFC 792). Es uno de los dos incidentes densos.
- **04 · Ping a ti mismo.** Comparas el `time=` de `127.0.0.1` (casi cero: el paquete no sale del equipo) con el de la impresora.
- **05 · Cuando no vuelve.** Caso A: `laptop-marta`, encendida, no contesta (timeout). La causa no se enseña aquí. Caso B: una IP sin dueño; tu propia laptop avisa «Destination Host Unreachable». Silencio frente a aviso.

### Bloque 3 · Salir de la oficina (06 a 10)

- **06 · Tu red y el router.** El ping al otro piso pasa por el router; el de la impresora, no. Lucía pregunta al final por qué.
- **07 · A quién mandas lo de afuera.** Tu laptop no tiene puerta de enlace y no saca paquetes de su red. Eliges la correcta.
- **08 · La red de redes.** Dos pings: al servidor de internet llega; a la impresora de otra oficina muere, porque miles de redes usan esa IP y internet no la enruta. Cómo sale el paquete de la oficina es una caja negra.
- **09 · Contar saltos.** Cada router resta 1 al TTL. En un bucle entre dos routers el TTL llega a 0 y el router que lo tira avisa. El bucle viene dado; el jugador diagnostica, no configura rutas.
- **10 · Ver el camino.** Cada línea de traceroute es la IP del router que avisó. Donde se corta, el último router que contestó señala el tramo roto.

### Bloque 4 · El guardia (11, 12 y 13)

- **11 · El guardia.** Resuelve el misterio del 05: `laptop-marta` tenía un firewall que descarta sin avisar, y ahora se ve. Es lo que el juego dice sobre la causa; la razón de diseño («para no revelar que hay alguien») no tiene fuente primaria verificada, así que el texto afirma el mecanismo y no cita a nadie.
- **12 · Tu primera regla.** Eliges el origen de la regla («cualquier origen» o solo soporte); todo lo demás queda bloqueado sin hacer nada. Es el segundo incidente denso.
- **13 · Entrar y salir.** Una regla de salida en tu laptop impide que el ping salga; una de entrada no lo arregla.

### Bloque 5 · Tu primera guardia (14)

Un solo id, `01-14`, con siete casos. El primero es guiado, con la secuencia de pruebas de cuatro peldaños (loopback, tu IP, la puerta de enlace, internet). Los otros seis van sin pistas y cada uno tiene una causa distinta:

| Caso | Causa | Lo que se ve |
|------|-------|--------------|
| 1 (guiado) | sin puerta de enlace | las tres primeras pruebas vuelven y la de internet ni sale |
| 2 | IP mal escrita | aviso de tu propia laptop |
| 3 | sin puerta de enlace | la misma causa del caso 1, ahora sin la secuencia, desde otro piso |
| 4 | IP privada hacia internet | silencio hacia una IP privada de otra oficina; el servidor de internet sí contesta |
| 5 | bucle (TTL) | Time Exceeded desde dos routers que se alternan |
| 6 | firewall de entrada | silencio solo hacia una laptop, que ahora se ve con su firewall |
| 7 | firewall de salida | tu laptop no deja salir nada, ni el ping a la puerta de enlace |

## Escalera de términos

Cada término se presenta en el incidente que lo necesita, ni antes ni después, con una definición rigurosa de 120 caracteres o menos que no nombra términos que el jugador aún no conoce. La tabla de arriba da los términos por incidente. Cambios sobre el registro actual (`src/copy/terms.ts`):

- Los 18 términos de hoy se reparten distinto: dispositivo, red, dirección IP e IPv4 en el 01 y paquete en el 02; ping, protocolo, ICMP, Echo Request y Echo Reply en el 03 (`solicitud` y `respuesta` dejan de ser términos, D-7); router en el 06; internet e IP privada en el 08; firewall y tráfico en el 11; regla en el 12.
- `least-privilege` (mínimo privilegio) pasa del 04-02 al 01-12.
- `public-ip` (IP pública) se presenta en el 08 «solo como término». Efecto en el capítulo 4 (D-5, decidido): la caja de inspección muestra las IP públicas.
- Dos términos del registro de hoy hablan de AWS y no sirven para el firewall de una laptop: `outbound-rule` nombra el Security Group en su definición, así que el 13 presenta `outbound` («salida») y `inbound` («entrada») como términos generales.
- Las fichas de regla del 12 («cualquier origen», «solo soporte») deben llevar un término cada una o una IP con su nombre (regla `rigorous-plain-copy`): el plan lo resuelve.

## Lo que la simulación enseña

La simulación sigue siendo un solo motor (`src/engine/`) que calcula el resultado de cada paquete; ningún texto lo decide.

- **Decisión local o remota** (RFC 1122, §3.3.1.1): «To decide if the destination is on a connected network, the following algorithm MUST be used»; si no está en la red conectada, «the destination is accessible only through a gateway». Un destino de tu red local se entrega directo; el de otra red va a la puerta de enlace.
- **TTL** (RFC 791, §3.1; RFC 1812, §5.3.1): cada router lo reduce al menos en uno, y con 0 el paquete se descarta y el router avisa con Time Exceeded, código 0.
- **Aviso de un router:** la dirección de origen de un mensaje ICMP que genera el router es una de las de la interfaz por la que sale (RFC 1812, §4.3.2.4). Como el aviso vuelve hacia quien envió, la IP que muestra traceroute es la del router del lado de quien envía. El juego dibuja esa.
- **Respuesta del ping:** el Echo Reply se forma invirtiendo origen y destino del Echo Request y cambiando el tipo de 8 a 0 (RFC 792).
- **IP sin dueño en tu red local:** en Linux la laptop no consigue resolver quién tiene la IP y el propio núcleo genera el Destination Host Unreachable (código 1 de ICMP, tipo 3) para el programa que envió (que el ping lo muestre con la IP de tu propia laptop como origen solo se vio en fuentes secundarias, ver «Sin verificar»). Es comportamiento de la implementación, no un requisito de un RFC (el RFC 1122, §2.4, dice que la capa de enlace no debe avisar solo porque no hay entrada en la caché ARP). El juego no nombra ARP: dice que tu laptop buscó quién tenía esa IP y nadie contestó.
- **Silencio:** un firewall que descarta (DROP) «tira el paquete al suelo» sin devolver nada; un REJECT, en cambio, devuelve un error (documentación de iptables). El timeout de ping es lo que ve quien no recibe respuesta.
- **Respuesta del firewall:** en este capítulo ningún firewall bloquea la respuesta de un ping que dejó pasar, ni en un sentido ni en el otro. Ningún texto explica por qué pasa: la razón real es que el firewall es stateful (capítulo 4), y dar otra («recuerda la conversación», «vuelve por el mismo camino») sería falso o prematuro. El texto afirma el hecho y no da razón.
- **Una IP privada no sale a internet** (RFC 1918, §3): los paquetes con direcciones privadas de origen o destino no deberían reenviarse entre empresas, y los routers de los proveedores filtran su información de enrutamiento.
- **Loopback** (RFC 1122, §3.2.1.3): las direcciones `127.x.x.x` son del propio equipo y «MUST NOT appear outside a host». El nombre `localhost` debe resolver a loopback (RFC 6761, §6.3); en el juego es un nombre que el equipo ya conoce, no una consulta DNS.

### Simplificaciones declaradas

| Simplificación | Por qué |
|----------------|---------|
| traceroute envía Echo Request con TTL creciente (como `tracert` de Windows y `traceroute -I` de Linux), no UDP; la terminal muestra `traceroute -I <ip>` | UDP y los puertos son del capítulo 2 |
| El RTT es una suma de latencias ilustrativas por tramo, no mediciones | Las cifras reales dependen de la red; el estudiante compara órdenes de magnitud |
| El TTL por defecto de un ping es 64 | Es lo que recomienda IANA y lo que usan Linux y macOS (`net.inet.ip.ttl`, verificado en el Mac del estudiante); Windows puede diferir (sin verificar) |
| La terminal muestra la sintaxis de Linux: `ping -t 3 <ip>` | Decisión D-10. En macOS `-t` es un tiempo límite y el TTL es `-m`; en Windows es `/i` |
| Los textos de aviso no citan la frase de ningún sistema | El texto exacto cambia entre Linux, macOS y Windows y solo el de Linux está verificado |
| El proveedor de internet son dos routers y un servidor con IP de documentación | Alcanza para ver saltos, un bucle y un tramo roto |
| Las rutas existen en el modelo, no se muestran ni se editan | La tabla de rutas es del capítulo 2 |
| Un router sin ruta puede responder o callar, según su configuración | La realidad lo permite (RFC 1812, §5.2.7.1 pide el aviso; algunas redes lo filtran) |

## Base de investigación (2026-10-10)

Todas las fuentes se consultaron el 2026-10-10. Una cita entre comillas es literal de lo que devolvió la consulta; el resto es paráfrasis. Las consultas pasan por un resumidor, así que lo que no aparece entre comillas no es una cita.

### Fuentes primarias verificadas

| Dato | Fuente |
|------|--------|
| Rangos privados: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | RFC 1918, §3 (febrero de 1996): https://www.rfc-editor.org/rfc/rfc1918 |
| «packets with private source or destination addresses should not be forwarded across such links.» y los routers de los proveedores «are expected to be configured to reject (filter out) routing information about private networks.» | RFC 1918, §3 |
| Echo es el tipo 8 y Echo Reply el tipo 0; «To form an echo reply message, the source and destination addresses are simply reversed» | RFC 792 (J. Postel, septiembre de 1981): https://www.rfc-editor.org/rfc/rfc792 |
| Destination Unreachable es el tipo 3; código 0 «net unreachable», 1 «host unreachable»; «Codes 0, 1, 4, and 5 may be received from a gateway.» | RFC 792 |
| Time Exceeded es el tipo 11, código 0 «time to live exceeded in transit»; «If the gateway processing a datagram finds the time to live field is zero it must discard the datagram.» | RFC 792 |
| TTL: «If this field contains the value zero, then the datagram must be destroyed.»; «This field indicates the maximum time the datagram is allowed to remain in the internet system.» | RFC 791, §3.1: https://www.rfc-editor.org/rfc/rfc791 |
| Una dirección IPv4 mide cuatro octetos (32 bits) | RFC 791, §2.3. Los cuatro números van de 0 a 255: AWS, «IP addressing for your VPCs and subnets», https://docs.aws.amazon.com/vpc/latest/userguide/vpc-ip-addressing.html («4 groups of up to 3 decimal digits, 0-255») |
| Un router reduce el TTL: «Each router (or other module) that handles a packet MUST decrement the TTL by at least one»; con cero «the packet MUST be discarded» y «the router MUST send an ICMP Time Exceeded message, Code 0 (TTL Exceeded in Transit) message to the source.» | RFC 1812, §5.3.1, p. 85: https://www.rfc-editor.org/rfc/rfc1812 |
| El origen de un ICMP que genera el router: «MUST be one of the IP addresses associated with the physical interface over which the ICMP message is transmitted.» | RFC 1812, §4.3.2.4, p. 53 |
| Un router genera Host Unreachable si no hay camino al host de una red conectada («does not respond to ARP») | RFC 1812, §5.2.7.1, p. 81 |
| Loopback: «Internal host loopback address. Addresses of this form MUST NOT appear outside a host.» | RFC 1122, §3.2.1.3(g): https://www.rfc-editor.org/rfc/rfc1122 |
| «Every host MUST implement an ICMP Echo server function that receives Echo Requests and sends corresponding Echo Replies.» | RFC 1122, §3.2.2.6, p. 42 |
| Decisión local o por puerta de enlace: «If not, then the destination is accessible only through a gateway.» | RFC 1122, §3.3.1.1, p. 47 |
| «The link layer MUST NOT report a Destination Unreachable error to IP solely because there is no ARP cache entry for a destination.» | RFC 1122, §2.4 |
| `localhost` siempre resuelve a loopback | RFC 6761, §6.3 (febrero de 2013): https://www.rfc-editor.org/rfc/rfc6761 |
| Bloques de documentación `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`; «SHOULD NOT appear on the public Internet» | RFC 5737 (enero de 2010): https://www.rfc-editor.org/rfc/rfc5737 |
| TTL por defecto 64: IANA, «The current recommended default time to live (TTL) for the Internet Protocol (IP) is 64»; Linux, `ip_default_ttl`, «Default: 64 (as recommended by RFC1700)» | https://www.iana.org/assignments/ip-parameters/ip-parameters.xhtml · https://docs.kernel.org/networking/ip-sysctl.html |
| Una IP sin dueño en la LAN: cuando falla la resolución de vecino, `arp_error_report` llama a `dst_link_failure`, que termina en `__icmp_send(skb, ICMP_DEST_UNREACH, ICMP_HOST_UNREACH, 0, ...)` generado en el propio equipo | Núcleo de Linux, `net/ipv4/arp.c` y `net/ipv4/route.c` (rama `master`, consultada el 2026-10-10): https://github.com/torvalds/linux/blob/master/net/ipv4/arp.c · https://github.com/torvalds/linux/blob/master/net/ipv4/route.c |
| El ping de Linux escribe «Destination Host Unreachable», «Destination Net Unreachable» y «Time to live exceeded», y ` time=%s ms` | iputils, `ping/ping.c` (`pr_icmph`) y `ping/ping_common.c`: https://github.com/iputils/iputils |
| ping usa «the ICMP protocol's mandatory ECHO_REQUEST datagram to elicit an ICMP ECHO_RESPONSE from a host or gateway»; `-t`: «Set the IP Time to Live.» | `ping(8)`, iputils 20221126: https://manpages.debian.org/bookworm/iputils-ping/ping.8.en.html |
| La opción de TTL de ping cambia con el sistema: Linux `-t`; macOS `-m ttl` fija el TTL y `-t timeout` es un tiempo límite en segundos, no el TTL; Windows `/i <TTL>`, «Specifies the value of the Time To Live (TTL) field in the IP header for echo Request messages sent. The default is the default TTL value for the host.» | Linux: la fila anterior. macOS 26.6.2: `man ping`, verificado por el copiloto en el Mac del estudiante el 2026-10-10 (no lo leí yo). Windows: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ping |
| TTL por defecto de macOS: `net.inet.ip.ttl` = 64 | `sysctl net.inet.ip.ttl`, verificado por el copiloto en el Mac del estudiante (macOS 26.6.2) el 2026-10-10 |
| traceroute usa el campo TTL y provoca un ICMP TIME_EXCEEDED de cada router; empieza con TTL 1 y sube de uno en uno; un `*` es una sonda sin respuesta tras el tiempo de espera; `-I` usa ICMP ECHO | `traceroute(8)`, FreeBSD: https://man.freebsd.org/cgi/man.cgi?query=traceroute&sektion=8 |
| traceroute de Linux: «utilizes the IP protocol's time to live (TTL) field and attempts to elicit an ICMP TIME_EXCEEDED response from each gateway»; el método por defecto envía datagramas UDP a puertos «unlikely»; `-I, --icmp`: «Use ICMP ECHO for probes»; un `*` si no hay respuesta; el máximo por defecto es 30 saltos | `traceroute(8)` del paquete traceroute 2.1.6, página del 11 de octubre de 2006, en la copia empaquetada de Arch Linux: https://man.archlinux.org/man/traceroute.8 (consultada el 2026-10-10). Es la página del proyecto (https://traceroute.sourceforge.net/, que no publica el texto del manual); man7.org y Debian no respondieron, así que no hay otra copia primaria |
| tracert envía Echo Request con TTL creciente; «When the TTL on a packet reaches 0, the router is expected to return an ICMP time Exceeded message to the source computer.»; muestra las interfaces cercanas de cada router y `*` si no responde | Microsoft Learn, `tracert`: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert |
| ping de Windows: el mensaje «Request timed out» aparece cuando no llega el Echo Reply en el tiempo de espera (4000 ms por defecto); `/i` fija el TTL | Microsoft Learn, `ping`: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ping |
| DROP: «DROP means to drop the packet on the floor.»; REJECT «is used to send back an error packet in response to the matched packet: otherwise it is equivalent to DROP» | `iptables(8)` e `iptables-extensions(8)`, Debian bookworm: https://manpages.debian.org/bookworm/iptables/iptables.8.en.html · https://manpages.debian.org/bookworm/iptables/iptables-extensions.8.en.html |
| Un Security Group solo deja pasar lo que una regla permite; «You can specify allow rules, but not deny rules.»; sin reglas de entrada «no inbound traffic is allowed until you add inbound rules»; es stateful | AWS, «Control traffic to your AWS resources using security groups» y «Security group rules»: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html · https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html |
| Las IPv4 privadas «are not reachable over the internet» | AWS, «IP addressing for your VPCs and subnets» |
| Mínimo privilegio: «grant only the permissions required to perform a task» | AWS, «Security best practices in IAM»: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html |

### Sin verificar

Lo siguiente **no** se pudo comprobar en una fuente primaria. El juego no lo afirma como hecho.

- **El texto exacto del aviso en macOS.** No se verificó: la copia de `ping(8)` de macOS 10.9 en manpagez.com no trae «Request timeout for icmp_seq», «Host is down», «No route to host» ni «Destination Host Unreachable», y en el Mac del estudiante solo se verificaron las opciones de TTL y el TTL por defecto. Tampoco se comprobó cómo se comporta macOS ante una IP sin dueño.
- **Que el ping de Linux muestre el aviso con la IP de tu propia laptop como origen** («From 192.168.1.10 … Destination Host Unreachable»). El núcleo genera el ICMP y iputils tiene la cadena (fuentes primarias), pero la línea completa solo se vio descrita en guías de diagnóstico y foros.
- **El texto del aviso en Windows.** La página oficial de `ping` solo documenta «Request timed out». «Destination host unreachable» con la IP de la propia laptop como origen solo aparece en foros de Microsoft Q&A y en archivos de foros, que no son documentación oficial; además se reporta que antes de Windows 7 una IP sin dueño daba «Request timed out».
- **El TTL por defecto de Windows.** La página de `ping` de Windows dice «the default TTL value for the host» sin cifra. Se suele decir 128, pero no se verificó.
- **Que el `traceroute` de macOS se comporte como el de FreeBSD o el de Linux.** Solo se leyó la página de FreeBSD y la del paquete 2.1.6 de Linux; no se comprobó el de macOS.
- **La razón por la que un firewall descarta en vez de rechazar** («para no revelar que hay alguien»). Las páginas de iptables solo dicen qué hace cada acción, no por qué se elige. Es la razón que el estudiante aprobó como idea del subcapítulo 11; el juego afirma el mecanismo y presenta la razón como idea de diseño, sin citar a nadie.
- **Las cifras del RTT** (loopback casi cero, un par de milisegundos en la oficina, decenas hacia internet) son ilustrativas, no medidas. Ninguna fuente las fija.

## Fuera del capítulo

- Puerto, TCP, UDP, CIDR y máscara, tabla de rutas, NAT y DNS: capítulo 2.
- Cliente/servidor y HTTP: capítulo 3.
- Stateful y stateless: capítulos 4 y 6.
- MAC, ARP, switch e IPv6: no se enseñan (ARP no se nombra, aunque lo hace el sistema).
- Que el jugador configure rutas o la tabla de un router.
- Reglas de denegación explícita (como el Security Group, el firewall del juego solo tiene reglas que permiten).

## Riesgos

- **Densidad de 03 y 12.** El 03 presenta cinco términos (`solicitud` y `respuesta` dejaron de ser términos, D-7) y una pregunta final sobre el encabezado de la respuesta. El 12 presenta cinco términos y dos fichas de origen que necesitan nombre. Son los primeros en separarse tras la prueba humana. Separar un incidente corre los ids siguientes, sin costo: no hay progreso que conservar (D-1).
- **Un firewall que no se ve.** El 05 pide un misterio que el 11 resuelve. Si el firewall aparece en el mapa, en un sello «Bloqueado» o en un motivo antes del 11, el misterio se estropea y la escalera de términos falla. El plan lo trata con una regla (las piezas, los sellos y los motivos dependen de lo que el jugador ya conoce) y una prueba por texto.
- **Primer día lento, otra vez.** Catorce subcapítulos antes del capítulo 4 es más que cuatro. Cada uno es corto por diseño y cada bloque tiene una prueba humana propia; si alguno sobra, se fusiona con el vecino.
- **Un bucle y un tramo roto son modelos de red.** Que el juego los traiga como mundo dado y no como rutas editables evita enseñar la tabla de rutas antes del capítulo 2; a cambio, el modelo guarda rutas que ninguna pantalla muestra.
- **Lo que el capítulo 4 hereda.** Presentar `public-ip` y `internet` en el capítulo 1 cambia lo que muestra la caja de inspección del capítulo 4 (D-5, aceptado). Las trazas del capítulo 4 no cambian.
