# Capítulo 2, «Puertos y nombres»: qué conceptos enseñar

Fecha: 2026-10-10 · Estado: investigación. No cambia el juego ni el código.

Parte de la [ficha del capítulo 2](2026-10-09-follow-the-packet-chapters.md) (líneas 71 a 77) y de sus tres preguntas. Revisa la lista borrador contra RFC, documentación de AWS y los objetivos de dos exámenes.

## Cómo leer este informe

- Frases cortas. Una idea por frase.
- Cada dato lleva una etiqueta de evidencia:
  - **[fuente]**: lo leí en la fuente citada, el 2026-10-10.
  - **[local]**: lo probé en el Mac del estudiante (macOS 26.6.2). Solo prueba ese Mac.
  - **[sin verificar]**: no pude confirmarlo. Se dice sin adornos.
- Las citas entre comillas las comprobé contra una copia local del RFC o de la página. Cuando solo tengo un resumen, lo digo.
- Los números de sección vienen del RFC.

---

## 1. Resumen de cambios propuestos a la lista

### Agregar (de más a menos importante)

1. **Dirección de escucha.** Un servicio puede escuchar solo en `127.0.0.1` o en todas las IPs (`0.0.0.0`). Es el «no conecta» que más sufre un desarrollador Node. Hoy no está.
2. **Puerto filtrado, aparte del cerrado.** Cerrado: el dispositivo contesta con RST. Filtrado: un firewall descarta y nadie contesta. Son dos fallos distintos y se ven distinto (rechazo inmediato frente a timeout). La lista los junta en «puerto cerrado».
3. **Rango de puertos en la regla.** Una regla es protocolo + rango de puertos + origen. Es lo que el jugador configura en este capítulo y lo que el capítulo 4 da por sabido.
4. **Conexión como cuatro datos más el protocolo.** Protocolo, IP:puerto de origen e IP:puerto de destino. Sin esto, NAT y «con estado» (capítulo 4) quedan en el aire.
5. **Puertos 3306 y 5432** (bases de datos). La batería de sondas del juego ya los prueba.
6. **SSH como término definido.** Los servidores del capítulo 4 escuchan en el 22 y nadie lo define.
7. **La decisión del propio dispositivo:** ¿el destino cae en mi bloque? Sí: entrega directa. No: a la puerta de enlace. Une CIDR, rutas y el capítulo 1.
8. **Destination Net Unreachable.** Es el par de Destination Host Unreachable del capítulo 1.
9. **SERVFAIL, caché negativa y «el resolver no contesta»,** junto a NXDOMAIN. Son tres «no resuelve» distintos.
10. **Regla del CNAME:** un nombre con CNAME no puede tener otros registros. Es el origen de los registros Alias de Route 53 (capítulo 17).
11. **NAT no es un firewall,** y el Internet gateway de AWS hace NAT uno a uno, distinto del NAT con puertos del router.
12. **Orden de diagnóstico:** ¿resuelve el nombre? ¿hay ruta? ¿contesta el puerto?

### Quitar, fusionar o mover

- **SYN y ACK** dejan de ser ítems: van dentro del saludo de tres pasos.
- **Parte de red y parte de equipo** van dentro de «prefijo».
- **Rangos privados en CIDR** no son un término nuevo: amplían `private-ip` del capítulo 1.
- **«ICMP no tiene puertos»** es una frase de la definición de puerto, no un ítem.
- **«Subred»** como palabra va al capítulo 6, donde es el componente de AWS. Aquí se dice «bloque». Se queda «máscara de subred» porque así la muestran `ipconfig` y la consola.
- **Archivo hosts, DHCP, SERVFAIL, tabla de traducciones y bit** pasan a nivel «Apoyo»: una definición, sin incidente propio.
- **Reenvío de puertos** pasa a «Opcional».

### Corregir (lo más grave)

- **NAT:** la nota «desde internet nadie inicia hacia un equipo detrás del NAT» está simplificada de más. Ver 4.5.
- **UDP cerrado:** no es silencio. Debería devolver ICMP Port Unreachable. El motor hoy calla (ver 2.2).
- **Puertos efímeros:** hay cuatro rangos distintos según el sistema. Ver 4.2.
- **DNS sobre TCP:** no es un caso raro. Todo servidor y resolver DEBE soportarlo. Ver 4.4.
- **`nc -vzu`:** da «succeeded» contra un puerto UDP sin servicio. No lo enseñes.
- **`dig` no lee el archivo hosts.** Puede decir NXDOMAIN mientras `ping` resuelve.
- **`0.0.0.0/0`** significa «cualquier origen» en una regla y «ruta por defecto» en una ruta.
- **`172.16.0.0/12`** cubre de 172.16 a 172.31. No es un /16.

### Decisión abierta: el tamaño

La lista final tiene **50 términos** (43 núcleo, 6 apoyo, 1 opcional). El capítulo 1 introduce **38** en **14** incidentes. La ficha estima 4 a 8 incidentes para el capítulo 2. A la razón del capítulo 1 (unos 2,7 términos por incidente) saldrían unos 16 incidentes solo con el núcleo.

Hay dos caminos. Decide el dueño del plan:

- **A. Un solo capítulo,** con unos 12 a 14 incidentes y 3 a 4 términos por incidente. Los términos de apoyo viven en el texto, sin incidente propio. No toca el plan de 33 capítulos.
- **B. Dos capítulos.** Corte natural: «Puertos y conexiones» (grupos A y B, 18 términos) y «Rutas, NAT y nombres» (grupos C a H, 32 términos). Pasa a 34 capítulos y mueve la numeración del resto.

No tomo la decisión. El plan de 33 capítulos está aprobado.

---

## 2. Lo que el capítulo 4 da por sabido

### 2.1 Qué hay hoy

Solo existen 04-01 y 04-02 ([`04-iaas/`](../../projects/follow-the-packet/src/levels/04-iaas/shared.ts)).

- Las reglas de entrada usan solo **ICMP** (`Echo Request`, `Echo Reply`, `All ICMP`) y un origen (`SG servidor1` o `Anywhere-IPv4`).
- **Ninguna regla lleva puerto.** El jugador nunca elige protocolo ni rango de puertos.
- Los dos servidores escuchan en un solo puerto: el **22 de TCP** (`SSH_PORT` en `shared.ts`).
- La VPC es `172.31.0.0/16`, con subredes `/20` que el mapa no dibuja todavía.

### 2.2 Qué asume el motor

- **La batería de sondas** ([`exposure.ts`](../../projects/follow-the-packet/src/engine/exposure/exposure.ts), `SERVICES`) prueba ICMP tipo 8 y 0, TCP 22, 80, 443, 3306 y 5432, y UDP 53. La estrella «sin abrir de más» depende de ella. El jugador del capítulo 4 tiene que reconocer esos puertos.
- **El esquema de reglas** ya admite `tcp` y `udp` con `fromPort` y `toPort`. El capítulo 2 puede usarlo tal cual.
- **El paquete solo lleva el puerto de destino** (`port`). No hay puerto de origen. NAT con puertos y la vuelta con puertos invertidos lo necesitan.
- **El anfitrión solo tiene `listeningTcpPorts`.** No hay servicios UDP ni dirección de escucha.
- **Desajuste de rigor.** [`host.ts`](../../projects/follow-the-packet/src/engine/simulation/stages/host.ts) trata todo UDP como «sin servicio» y calla (`host-udp-no-service`, resultado `arrived-no-reply`). En la realidad, un puerto UDP cerrado debería devolver ICMP Port Unreachable (ver 4.3). Lo señalo, no lo arreglo.

### 2.3 Qué prometía la escalera para 04-03 a 04-08

Fuente: [spec de incidentes en vivo](../specs/2026-10-08-follow-the-packet-live-incidents-design.md), tabla del capítulo 4.

| Incidente | Término nuevo planeado | Lo que da por sabido del capítulo 2 |
|-----------|------------------------|--------------------------------------|
| 04-03 El camino de vuelta | stateful, reglas de salida | Puerto de origen y de destino, puerto efímero, conexión como cuatro datos más el protocolo. |
| 04-04 Demasiado ancho | CIDR (/32, /16), rango de la VPC | Prefijo, tamaño del bloque, **pertenencia** (¿`172.31.16.131` está en `172.31.16.0/20`?), `/32`, `0.0.0.0/0`. |
| 04-05 La IP pública | IP pública, NAT | NAT. Ojo: el Internet gateway hace NAT **uno a uno** (ver 4.5). `public-ip` ya la introduce el capítulo 1 (01-08). |
| 04-06 El nombre | DNS, nombre público y privado | Nombre a IP, resolver, registro A, «desde dentro y desde fuera da distinto». |
| 04-07 ¿Portero o dueño? | tcpdump, `icmp_echo_ignore_all` | Llegar frente a contestar. Cerrado frente a filtrado. ICMP frente a TCP. |
| 04-08 El club default | Security Group default | Nada del capítulo 2. |

### 2.4 Qué términos del registro cambian de capítulo

El registro está en [`terms.ts`](../../projects/follow-the-packet/src/copy/terms.ts). El [documento de capítulos](2026-10-09-follow-the-packet-chapters.md) (línea 370) ya dice que CIDR, NAT y DNS genéricos pasan al capítulo 2.

| Término actual | Qué hacer |
|----------------|-----------|
| `cidr` | Pasa al capítulo 2. La definición actual es correcta; cambiar «IP/número» por «IP/prefijo». |
| `dns` | Pasa al capítulo 2. Añadir el puerto 53. |
| `nat` | Pasa al capítulo 2 y **se reescribe**. Hoy describe solo el Internet gateway («al salir por el Internet gateway…»). En el capítulo 2 es el NAT con puertos del router. En 04-05 el Internet gateway solo enseña la versión uno a uno, sin término nuevo. |
| `public-ip` | Ya es del capítulo 1. 04-05 no debería marcarla «nuevo». |
| `rule` | Hoy dice «Type» y «Source». En el capítulo 2 «Type» gana el rango de puertos. Ver `port-range`. |
| `vpc-range`, `public-dns-name`, `private-dns-name` | Se quedan en el capítulo 4. Son nombres de AWS. |
| `stateful`, `outbound-rule` | Se quedan en el capítulo 4. El capítulo 2 no los usa. |

Respuesta corta a la primera pregunta de la ficha del capítulo 4: pasan al 2 `cidr`, `dns` y `nat` (genérico); se quedan en el 4 `vpc-range` y los dos nombres DNS de la instancia.

---

## 3. Lista final recomendada

Qué significan las columnas:

- **Id:** inglés, kebab-case, como el registro. Los ids son una propuesta.
- **Definición:** máximo 120 caracteres, la regla de `terms.test.ts`. Medí cada una con un script.
- **Nivel:**
  - **Núcleo:** sin él, el capítulo 3, 4 o 6 no se entiende.
  - **Apoyo:** ayuda, pero cabe en el texto de otro incidente.
  - **Opcional:** puede esperar.
- Orden de aparición pensado para que cada definición use solo términos anteriores. Lo revisé a mano. La prueba `ladder.test.ts` es la que decide.
- «Sistema operativo» y «consola» aparecen en dos definiciones. No son términos del registro. Si el capítulo 3 los introduce, conviene mirar el orden.

### A. Puertos y servicios

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `service` | servicio | Un programa de un dispositivo que atiende los paquetes que le llegan de otros dispositivos. | Núcleo |
| `port` | puerto | Un número de 0 a 65535 que, junto con la IP, dice a qué servicio de un dispositivo va un paquete. | Núcleo |
| `listen` | escuchar | Un servicio escucha cuando espera paquetes en un puerto de una de las IPs del dispositivo. | Núcleo |
| `client-server` | cliente y servidor | El cliente inicia el contacto y el servidor espera y responde. Son roles de cada intercambio, no tipos de equipo. | Núcleo |
| `ip-port` | IP:puerto | La IP y el puerto juntos, como 172.31.16.131:22. Señalan un servicio concreto de un dispositivo concreto. | Núcleo |
| `destination-port` | puerto de destino | El puerto del servicio al que va el paquete. | Núcleo |
| `source-port` | puerto de origen | El puerto desde el que sale el paquete. A ese puerto vuelve la respuesta. | Núcleo |
| `ephemeral-port` | puerto efímero | El puerto de origen que el dispositivo elige para cada intercambio nuevo. Su rango depende del sistema operativo. | Núcleo |

### B. TCP y UDP, y los dos modos de fallo

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `tcp` | TCP | Transmission Control Protocol: abre una conexión, entrega los datos en orden y reenvía lo que se pierde. | Núcleo |
| `connection` | conexión | Un intercambio TCP entre dos IP:puerto: se abre, se usa y se cierra. | Núcleo |
| `handshake` | saludo de tres pasos | Así abre TCP una conexión: el cliente manda SYN, el servidor contesta SYN-ACK y el cliente confirma con ACK. | Núcleo |
| `rst` | RST | Un paquete TCP que dice «aquí no hay conexión». Lo manda quien recibe un SYN en un puerto donde nadie escucha. | Núcleo |
| `udp` | UDP | User Datagram Protocol: manda cada mensaje suelto, sin conexión ni confirmación. Si se pierde, UDP no lo reenvía. | Núcleo |
| `closed-port` | puerto cerrado | Un puerto donde nadie escucha. El dispositivo lo avisa: con un RST en TCP, con un ICMP «Port Unreachable» en UDP. | Núcleo |
| `filtered-port` | puerto filtrado | Un puerto cuyo tráfico descarta un firewall: nadie contesta y quien envía solo ve un timeout. | Núcleo |
| `port-range` | rango de puertos | El puerto o los puertos que permite una regla: uno solo (22) o un rango (7000-8000). Va junto al protocolo. | Núcleo |
| `ssh` | SSH | Secure Shell: el servicio para manejar un servidor desde una consola remota. Escucha por costumbre en el puerto 22. | Núcleo |
| `well-known-ports` | puertos conocidos | Números que cada servicio usa por costumbre, como el 22 de SSH. Es una convención: nada obliga a respetarla. | Núcleo |

### C. Bloques de direcciones

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `bit` | bit | La unidad mínima de datos: un 0 o un 1. Una IPv4 tiene 32 bits: cuatro números de 8 bits. | Apoyo |
| `prefix` | prefijo | Los primeros bits de una IP, iguales para todo un bloque. Los demás bits distinguen a cada dispositivo del bloque. | Núcleo |
| `cidr` | CIDR | Un bloque de IPs escrito IP/prefijo: /24 son 256 IPs; /32, una sola; 0.0.0.0/0, todas las IPv4. | Núcleo |
| `subnet-mask` | máscara de subred | El prefijo escrito como una IP: los bits en 1 son la parte fija. /24 es 255.255.255.0. | Núcleo |

### D. Rutas

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `next-hop` | siguiente salto | La IP del router al que se entrega el paquete en el próximo paso de su camino. | Núcleo |
| `route` | ruta | Una instrucción de reenvío: los paquetes para este bloque de IPs van a este siguiente salto. | Núcleo |
| `routing-table` | tabla de rutas | La lista de rutas de un dispositivo o router. Cada paquete que sale se compara con ella. | Núcleo |
| `connected-route` | ruta de red conectada | La ruta del bloque al que el dispositivo está conectado: esos paquetes se entregan directo, sin router. | Núcleo |
| `default-route` | ruta por defecto | La ruta 0.0.0.0/0: recibe lo que ninguna otra ruta cubre. Su siguiente salto es la puerta de enlace predeterminada. | Núcleo |
| `most-specific-route` | ruta más específica | Si varias rutas cubren un destino, gana la de prefijo más largo: /32 antes que /24, y /24 antes que 0.0.0.0/0. | Núcleo |
| `net-unreachable` | Destination Net Unreachable | Un aviso ICMP de que un router no tiene ruta a esa red. Es el par de Destination Host Unreachable. | Apoyo |

### E. NAT

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `nat` | NAT | Network Address Translation: un router cambia la IP privada de origen por una pública al salir, y lo deshace al volver. | Núcleo |
| `napt` | traducción de puertos | NAT que también cambia el puerto de origen. Así muchas IPs privadas comparten una pública sin mezclarse. | Núcleo |
| `translation-table` | tabla de traducciones | La lista que guarda el router con cada IP:puerto privado y su IP:puerto público, para devolver cada respuesta. | Apoyo |
| `port-forwarding` | reenvío de puertos | Una traducción fija: lo que llega a la IP pública del router en un puerto va a un dispositivo interno. | Opcional |

### F. DNS

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `domain-name` | nombre de dominio | Un nombre legible, como example.com, escrito por niveles separados por puntos. Se lee de derecha a izquierda. | Núcleo |
| `dns` | DNS | Domain Name System: el sistema que convierte un nombre de dominio en una IP. Usa el puerto 53. | Núcleo |
| `dns-query` | consulta DNS | Una pregunta por un nombre. La respuesta trae su IP o dice que no existe. Suele viajar por UDP. | Núcleo |
| `resolver` | resolver | El servidor DNS al que pregunta un dispositivo. Si no conoce la respuesta, la busca por él. | Núcleo |
| `authoritative-server` | servidor autoritativo | El servidor DNS que guarda los registros de un dominio y da la respuesta definitiva. | Núcleo |
| `dns-record` | registro DNS | Una entrada del DNS con cuatro datos: nombre, tipo, valor y cuánto tiempo puede guardarse. | Núcleo |
| `a-record` | registro A | Un registro que asocia un nombre con una IPv4. | Núcleo |
| `cname-record` | registro CNAME | Un registro que hace de un nombre un alias de otro nombre, no de una IP. Ese nombre no puede tener más registros. | Núcleo |
| `dns-cache` | caché DNS | Las respuestas que el resolver guarda para no preguntar de nuevo, hasta que vence su tiempo de vida. | Núcleo |
| `dns-ttl` | TTL de DNS | Los segundos que una respuesta puede quedar en caché. No es el TTL de IP, que cuenta saltos. | Núcleo |
| `nxdomain` | NXDOMAIN | La respuesta del DNS «ese nombre no existe». El resolver también la guarda en caché un tiempo. | Núcleo |
| `servfail` | SERVFAIL | La respuesta del DNS «el servidor no pudo contestar». No dice si el nombre existe. | Apoyo |
| `hosts-file` | archivo hosts | Un archivo del dispositivo que asocia nombres con IPs, sin usar DNS. Ahí suele estar localhost. | Apoyo |

### G. DHCP

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `dhcp` | DHCP | Dynamic Host Configuration Protocol: un servidor presta a cada dispositivo su IP, máscara, puerta de enlace y DNS. | Apoyo |

### H. Diagnóstico y herramientas

| Id | Término | Definición (máx. 120 caracteres) | Nivel |
|----|---------|----------------------------------|-------|
| `connection-refused` | Connection refused | El error de quien conecta a un puerto que rechaza la conexión: llegó un RST. Casi siempre, un puerto cerrado. | Núcleo |
| `nc` | nc | Una herramienta de consola. nc -vz IP puerto prueba si un puerto TCP acepta conexiones, sin enviar datos. | Núcleo |
| `dig` | dig | Una herramienta de consola que hace una consulta DNS y muestra la respuesta completa, con su estado. | Núcleo |
### Notas de la lista

**Conexión y flujo.** Una conexión TCP se identifica por el protocolo y las dos mitades IP:puerto. RFC 9293 §4 la define como «a logical communication path identified by a pair of sockets» **[fuente]**. AWS rastrea las conexiones con los datos de puerto: «Information about the connection (including the port information) is tracked» **[fuente]**. En UDP no hay conexión. Los firewalls hablan de «flujos» (AWS dice «UDP flows») **[fuente]**. Propuesta: el registro usa `connection`; el texto dice «flujo» cuando incluye UDP. Cuidado: el contrato de niveles ya usa `Flow` para otra cosa (un paquete de prueba). Nunca se muestra en pantalla.

**Ida y vuelta con puertos invertidos.** Este dibujo prepara el capítulo 4 («con estado») y el 6 («sin estado»):

```
ida:     203.0.113.9:51514  →  172.31.16.131:22
vuelta:  172.31.16.131:22   →  203.0.113.9:51514
```

El puerto efímero es el de origen de la ida. La regla de entrada abre el 22. A la vuelta nadie abre el 51514: el capítulo 4 explica por qué pasa.

**Puertos que el juego muestra en las fichas.** Cada puerto entra con su servicio, no antes. Fuente de los números: registro de IANA y la página de reglas de ejemplo de AWS **[fuente]**.

| Puerto | Protocolo | Servicio | Entra en | Nota |
|--------|-----------|----------|----------|------|
| 22 | TCP | SSH | Capítulo 2 | IANA: `ssh`, «The Secure Shell (SSH) Protocol». |
| 53 | UDP y TCP | DNS | Capítulo 2, grupo F | IANA lo registra en los dos. AWS pide los dos para un servidor DNS. |
| 80 | TCP | HTTP (web) | Solo el número en el 2. El contenido, en el 3 | IANA lo registra también en UDP; la web usa TCP. |
| 443 | TCP | HTTPS (web con TLS) | Solo el número en el 2. TLS, en el 3 | IANA lista también `443/udp`. Qué lo usa: **[sin verificar]**. |
| 3306 | TCP | MySQL y Aurora | Solo el número en el 2. Bases, en el 10 | Está en 1024 a 49151 (puerto registrado, no «conocido»). |
| 5432 | TCP | PostgreSQL | Igual que 3306 | Igual. |
| 67 y 68 | UDP | DHCP (servidor y cliente) | Solo en la definición de DHCP, sin regla | IANA: `bootps` y `bootpc`. |

No entran aún: 3389 (RDP, cuando haya una instancia Windows), 2049 (NFS, capítulo 10), 123 (NTP, capítulo 16), 25 (SMTP).

**Tamaño de los bloques.** Son 2 elevado a (32 − prefijo) direcciones. Direcciones, no equipos.

| Prefijo | Direcciones | Dónde aparece en el juego |
|---------|-------------|----------------------------|
| /0 | 4 294 967 296 | `0.0.0.0/0`, todas las IPv4 |
| /8 | 16 777 216 | `10.0.0.0/8` |
| /12 | 1 048 576 | `172.16.0.0/12` |
| /16 | 65 536 | `172.31.0.0/16` (la VPC), `192.168.0.0/16` |
| /20 | 4 096 | `172.31.16.0/20` (la subred de servidor1) |
| /24 | 256 | `192.168.1.0/24` (la oficina del capítulo 1) |
| /28 | 16 | Tamaño mínimo de una VPC o una subred en AWS |
| /32 | 1 | Una sola IP |

Fuentes: RFC 1918 §3 para /8, /12 y /16 privados; AWS «IPv4 VPC CIDR blocks» para /16 a /28; spec del capítulo 1 para la oficina **[fuente]**.

**Orden sugerido de bloques de incidentes** (para el camino A). Es una propuesta, no un diseño.

1. **Quién escucha:** servicio, puerto, escuchar (incluida la dirección), IP:puerto, cliente y servidor, puerto de destino.
2. **Ida y vuelta:** puerto de origen, puerto efímero, TCP, conexión, saludo, UDP, rango de puertos, SSH, puertos conocidos.
3. **Cerrado o bloqueado:** RST, puerto cerrado, puerto filtrado, Connection refused, `nc`.
4. **Un bloque de direcciones:** bit, prefijo, CIDR, máscara de subred.
5. **Por dónde sale:** ruta, tabla de rutas, siguiente salto, red conectada, ruta por defecto, más específica, Net Unreachable.
6. **Una IP para todos:** NAT, traducción de puertos, tabla de traducciones.
7. **Nombres:** de nombre de dominio a NXDOMAIN, `dig`, archivo hosts, DHCP y la guardia final.

---

## 4. Correcciones de rigor

### 4.1 Revisión de cada definición de la lista

Veredicto: **Correcto**, **Incompleto** (falta algo importante) o **Simplificado** (dice algo falso en algún caso).

**A. Puertos y servicios**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| Puerto (0–65535) | Incompleto | Son 16 bits. El 0 está reservado: se puede usar 1 a 65535. El puerto vive en el encabezado de TCP o UDP, no en el de IP. | IANA: puerto 0 `Reserved` en tcp y udp **[fuente]**. RFC 768 (formato) **[fuente]**. |
| Puerto de origen y de destino | Correcto | En UDP el de origen es opcional: «If not used, a value of zero is inserted». | RFC 768 **[fuente]**. |
| Cliente y servidor | Incompleto | Son roles de cada conexión, no tipos de equipo. Un servidor web es cliente de su base de datos. | Razonamiento. |
| Puertos conocidos 22, 53, 80, 443 | Correcto | Están en 0 a 1023, los «System Ports, also known as the Well Known Ports». 3306 y 5432 están en 1024 a 49151 («User Ports»). Un número solo es una costumbre: «Assignment of a service name or port number does not in any way imply an endorsement…». | RFC 6335 §6 y §9 **[fuente]**. |
| SSH | Incompleto | Falta definirlo. IANA: 22, TCP (RFC 4251). | IANA **[fuente]**. |
| Puerto efímero | Simplificado | Cuatro rangos según el sistema. Ver 4.2. | Ver 4.2. |
| Puerto cerrado | Simplificado | Junta dos fallos. Cerrado: el dispositivo contesta. Filtrado: un firewall descarta y nadie contesta. Ver 4.3. | nmap, RFC 9293 **[fuente]**. |
| (falta) Escuchar | Incompleto | Un servicio escucha en una IP y un puerto. `127.0.0.1` solo atiende al propio dispositivo. `0.0.0.0` atiende en todas las IPs del dispositivo. No confundir con el bloque `0.0.0.0/0`. | Node.js: sin `host`, escucha en `::` o en `0.0.0.0`. `ip(7)`: con `INADDR_ANY` el socket queda «bound to all local interfaces» **[fuente]**. |

**B. TCP y UDP**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| TCP: con conexión, confirma y retransmite | Incompleto | Falta «en orden» y que es un **flujo de bytes**: TCP no conserva los límites de los mensajes. | RFC 9293 §2.2: «a reliable, in-order, byte-stream service» **[fuente]**. Lo de los límites es consecuencia del flujo de bytes (razonamiento). |
| Saludo de tres pasos | Correcto | SYN, SYN-ACK, ACK. «The 'three-way handshake' is the procedure used to establish a connection». | RFC 9293 §3.5 **[fuente]**. |
| RST (puerto cerrado) | Correcto, con matiz | Un dispositivo sin conexión para ese paquete contesta RST. RST también aborta conexiones abiertas y algunos firewalls lo envían para rechazar. | RFC 9293 §3.10.7.1: «An incoming segment not containing a RST causes a RST to be sent in response.» **[fuente]**. macOS: ECONNREFUSED es «ignored (because the target is not listening for connections) or explicitly rejected» **[local]**. |
| UDP: sin conexión ni confirmación | Correcto | «delivery and duplicate protection are not guaranteed». UDP no reenvía, pero la aplicación sí puede: DNS reintenta. | RFC 768; RFC 1035 §4.2.1 **[fuente]**. |
| ICMP no tiene puertos | Correcto, con matiz | Echo lleva un identificador y un número de secuencia. El RFC dice que el identificador «might be used like a port in TCP or UDP». NAT usa ese identificador. | RFC 792 (Echo); RFC 3022 §2 «ICMP query ID» **[fuente]**. |
| (falta) Cuánto tarda un timeout | Incompleto | Un SYN sin respuesta se reenvía. El RFC exige reintentar al menos 3 minutos (MUST). Linux, por defecto, se rinde a los 131 s aproximadamente. Depende del sistema. No enseñes un número fijo. | RFC 9293 §3.8.3 (MUST-23; SHLD-11, 100 s). Kernel: `tcp_syn_retries` 6 → 131 s **[fuente]**. Windows y macOS: **[sin verificar]**. |

**C. Bloques de direcciones**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| Bit, IPv4 = 32 bits | Correcto | Una IPv4 son cuatro números de 8 bits. | RFC 4632 §3.1 **[fuente]**. |
| CIDR, prefijo | Correcto | «a decimal value between 0 and 32 that describes the number of significant bits». | RFC 4632 §3.1 **[fuente]**. |
| Máscara (/24 = 255.255.255.0) | Correcto | La máscara escribe el prefijo como una IP: unos a la izquierda, ceros a la derecha. | RFC 4632 §3.1 **[fuente]**. |
| /32 | Correcto | Una sola IP («host route»). AWS lo exige para una IP en una regla: «You must use the `/32` prefix length». | RFC 4632 §3.1; AWS reglas de SG **[fuente]**. |
| 0.0.0.0/0 | Incompleto | Dos usos. En una **regla**: cualquier origen o destino (Anywhere-IPv4). En una **ruta**: la ruta por defecto, que «MUST be accepted by all implementations». | RFC 4632 §5.1 **[fuente]**. |
| Rangos privados en CIDR | Correcto, con avisos | `10.0.0.0/8`, `172.16.0.0/12` y `192.168.0.0/16`. El error típico es leer el segundo como /16: cubre de 172.16 a 172.31. No todo lo «interno» es RFC 1918: `100.64.0.0/10` es el «Shared Address Space» (RFC 6598) y `169.254.0.0/16` es link-local (RFC 3927). AWS no admite `169.254.0.0/16` como CIDR de una VPC. | RFC 1918 §3; RFC 6598; RFC 3927; AWS «IPv4 VPC CIDR blocks» **[fuente]**. |
| Subred | Mover | En AWS «subnet» es un componente (capítulo 6). Aquí se dice «bloque». | Colisión de nombres. |
| (falta) Forma canónica | Incompleto | `172.31.16.0/20` es un bloque. `172.31.16.131/20` es una IP con su prefijo (así la muestra `ip addr`). AWS convierte `100.68.0.18/18` en `100.68.0.0/18`. | AWS «Subnet sizing» **[fuente]**. |
| (falta) Direcciones no son equipos | Incompleto | Un /24 tiene 256 direcciones. AWS reserva 5 por subred (red, router `.1`, DNS `.2`, `.3`, difusión). Dejar la cuenta exacta para el capítulo 6. | AWS «Subnet sizing» **[fuente]**. |

**D. Rutas**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| Ruta, tabla de rutas, siguiente salto | Correcto | AWS no dice «siguiente salto». Dice **Destination** y **Target**. Anotar la equivalencia para el capítulo 6. | AWS «Route table concepts» **[fuente]**. |
| Ruta local (red conectada) | Simplificado | En AWS, «Local route — A default route for communication within the VPC». Es la ruta del rango de la VPC. No es lo mismo que la ruta de red conectada de un dispositivo. En el capítulo 2 conviene llamarla «ruta de red conectada». | AWS **[fuente]**. |
| Ruta por defecto 0.0.0.0/0 | Correcto | Su siguiente salto es la puerta de enlace predeterminada del capítulo 1. Decirlo explícitamente. | RFC 4632 §5.1 **[fuente]**. |
| Gana la ruta más específica | Correcto | «Forwarding in the Internet is done on a longest-match basis». AWS: «This is known as the longest prefix match»; `10.10.2.15/32` gana a `10.10.2.0/24`. Con el mismo prefijo AWS aplica más reglas (estáticas antes que propagadas): capítulo 12. | RFC 4632 §5.1; AWS «Route priority» **[fuente]**. |
| (falta) Cada dispositivo tiene su tabla | Incompleto | También la laptop decide: ¿el destino cae en mi bloque? Entrega directa. Si no, a la puerta de enlace. | Razonamiento; une los capítulos 1 y 2. |

**E. NAT**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| NAT cambia la IP de origen y lo deshace | Correcto | Es el «NAT tradicional». Tiene dos variantes: Basic NAT (solo direcciones) y NAPT (direcciones y puertos). | RFC 3022 resumen y §2 **[fuente]**. |
| Traducción de puertos | Correcto | Es NAPT: «many network addresses and their TCP/UDP […] ports are translated into a single network address and its TCP/UDP ports». También cambia el puerto de origen (ejemplo del RFC: `10.0.0.10:3017` pasa a `138.76.28.4:1024`). | RFC 3022 **[fuente]**. |
| «Nadie inicia hacia un equipo detrás del NAT» | Simplificado | Ver 4.5. | Ver 4.5. |

**F. DNS**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| Resolver | Incompleto | Hay dos: el **stub** del dispositivo y el **recursivo**, que busca por él. En el juego, «resolver» es el servidor al que pregunta el dispositivo. Route 53 Resolver «only supports recursive DNS queries». | RFC 8499; AWS «Understanding Amazon DNS» **[fuente]**. |
| Servidor autoritativo | Correcto | «A server that knows the content of a DNS zone from local knowledge». | RFC 8499, cita de RFC 2182 **[fuente]**. |
| Registro A | Correcto | Una dirección de 32 bits. | RFC 1035 §3.4.1 **[fuente]**. |
| Registro CNAME | Incompleto | Falta la regla: «If a CNAME RR is present at a node, no other data should be present». RFC 2181 §10.1 la hace exacta: o un CNAME, o registros que no son CNAME. Por eso no hay CNAME en la raíz de la zona. | RFC 1034 §3.6.2; RFC 2181 §10.1. Route 53: «You can't create a CNAME record for example.com, but you can create an alias record» **[fuente]**. |
| Caché DNS | Correcto | Un resolver recursivo «is expected to cache the answers it receives». | RFC 8499 **[fuente]**. |
| TTL de DNS en segundos | Correcto, con matiz | Entero sin signo, máximo 2^31 − 1. Es un máximo, no una orden: «The TTL specifies a maximum time to live, not a mandatory time to live». Los resolvers pueden recortarlo. El TTL de IP cuenta saltos. | RFC 2181 §8 **[fuente]**. |
| NXDOMAIN | Correcto, con matices | RCODE 3. «Meaningful only for responses from an authoritative name server». Se guarda en caché: el TTL es el menor entre el campo MINIMUM del SOA y el TTL del propio SOA. Distinto de **NODATA**: el nombre existe pero no hay registro de ese tipo. | RFC 1035 §4.1.1; RFC 2308 §2.1, §2.2, §3 y §5 **[fuente]**. |
| Archivo hosts | Correcto, con avisos | Asocia IPs con nombres. Quién va primero (hosts o DNS) lo decide la configuración del sistema. `dig` no lo lee. | hosts(5) **[fuente]**. `dig localhost` dio NXDOMAIN mientras `ping localhost` resolvió **[local]**. El orden por defecto en Amazon Linux: **[sin verificar]**. |
| DNS usa UDP 53 y TCP para respuestas grandes | Incompleto | Ver 4.4. | Ver 4.4. |

**G. DHCP**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| DHCP entrega IP, máscara, puerta de enlace y DNS | Correcto, con matiz | La IP es un **préstamo** (lease). El cliente pide con DISCOVER y REQUEST; el servidor ofrece con OFFER y confirma con ACK. Las opciones: máscara (RFC 2132 §3.3), router (§3.5) y servidores DNS (§3.8). Puertos UDP 67 (servidor) y 68 (cliente). | RFC 2131; RFC 2132; IANA `bootps` y `bootpc` **[fuente]**. |
| En AWS | Matiz | Las instancias hablan con servidores DHCP de Amazon para su IP y «other network configuration information (such as the IP address of an Amazon DNS server or the IP address of the router in your VPC)». El **conjunto de opciones** de la VPC controla DNS, dominio, NTP y NetBIOS. No se puede modificar: se crea otro. Sin conjunto asociado, «this disables domain name resolution in the VPC». | AWS «Work with DHCP option sets» y «DHCP option sets in Amazon VPC» **[fuente]**. |
| Peso en los exámenes | Matiz | La guía SAA-C03 v1.1 no contiene «DHCP» (cero coincidencias en el texto). Network+ lo trata como servicio de red base. | Guía SAA-C03 **[fuente]**. CompTIA: resumen, ver sección 7. |

**H. Diagnóstico**

| Ítem de la lista | Veredicto | Corrección | Evidencia |
|------------------|-----------|------------|-----------|
| Connection refused (RST) | Correcto | `nc -vz 127.0.0.1 9` dijo «Connection refused» (nadie escucha). | **[local]**. |
| Timeout | Incompleto | En TCP es un SYN sin respuesta. Causas: un firewall que descarta, una ruta que falta, el dispositivo apagado. AWS lista Security Group, tabla de rutas y network ACL como causas de «Connection timed out». | AWS «Troubleshoot issues connecting to your Amazon EC2 Linux instance» **[fuente]**. `nc -vz 10.255.255.1 80` dio «Operation timed out» **[local]**. |
| Network Unreachable (sin ruta) | Simplificado | Mezcla dos cosas. (1) Error **local**: el dispositivo no tiene ruta (`ENETUNREACH`, «The network isn't reachable from this host»). (2) Aviso **ICMP** tipo 3, código 0, de un router («net unreachable»); el RFC dice que el router «may send» ese aviso. Propongo el término para el (2) y explicar el (1) en el texto. | `man 2 connect` **[local]**. RFC 792 **[fuente]**. Texto exacto de `ping` en Linux: **[sin verificar]**. |
| NXDOMAIN | Correcto | Ver F. Falta SERVFAIL (RCODE 2, «Server failure») y el caso «el resolver no contesta» (timeout contra el puerto 53). | RFC 1035 §4.1.1 **[fuente]**. |

### 4.2 Puertos efímeros: cuatro rangos

El cliente elige el rango. AWS lo dice así: «The client that initiates the request chooses the ephemeral port range» **[fuente]**.

| Origen | Rango | Fuente |
|--------|-------|--------|
| IANA (recomendación) | 49152 a 65535 | RFC 6335 §6: «Dynamic Ports… Private or Ephemeral Ports» **[fuente]** |
| Linux (kernel, por defecto) | 32768 a 60999 | Kernel `ip_local_port_range` **[fuente]** |
| Linux, según la página de NACL de AWS | 32768 a 61000 | AWS: «including the Amazon Linux kernel» **[fuente]**. Difiere del kernel actual en uno. Cuál usa Amazon Linux hoy: **[sin verificar]** |
| Windows Vista y Windows Server 2008 en adelante | 49152 a 65535 | Microsoft KB 929851 **[fuente]** |
| Windows hasta Server 2003 | 1025 a 5000 | Microsoft KB 929851; AWS **[fuente]** |
| macOS | 49152 a 65535 | `sysctl net.inet.ip.portrange.first/last` **[local]**. Documentación de Apple: **[sin verificar]** |
| NAT gateway, Elastic Load Balancing, AWS Lambda | 1024 a 65535 | AWS «Ephemeral ports» y «NAT gateway basics» **[fuente]** |

Regla práctica de AWS para una network ACL (capítulo 6): abrir 1024 a 65535 cubre todos los clientes **[fuente]**.

### 4.3 Qué responde un puerto cerrado, TCP y UDP

| Caso | Qué ve quien envía | Fuente |
|------|--------------------|--------|
| TCP, puerto cerrado | RST de inmediato. «Connection refused». | RFC 9293 §3.10.7.1 **[fuente]**; **[local]** |
| TCP, firewall que descarta | Nada. Timeout. | AWS (Security Group → «Connection timed out») **[fuente]** |
| UDP, puerto cerrado | ICMP Port Unreachable (tipo 3, código 3), si el dispositivo lo envía. | RFC 1122 §4.1.3.1: «UDP SHOULD send an ICMP Port Unreachable message». RFC 792: el destino «may send» un destination unreachable **[fuente]** |
| UDP, puerto abierto | Muchas veces nada, si el paquete va vacío. | nmap: los puertos abiertos «rarely respond to empty probes» **[fuente]** |
| UDP, firewall que descarta | Nada. | nmap **[fuente]** |

Tres consecuencias:

1. **«Sin respuesta» en UDP no distingue** entre abierto y filtrado. nmap lo llama `open|filtered`.
2. **El aviso se limita.** Linux manda como máximo uno por segundo a cada destino (`icmp_ratelimit`, 1000 ms por defecto) **[fuente]**. nmap lo cita como causa de escaneos UDP lentos.
3. **El motor hoy calla** ante todo UDP (ver 2.2). Para el capítulo 2 habría tres salidas: servicio que contesta, ICMP Port Unreachable y silencio por firewall.

Prueba en el Mac: `nc -vzu 127.0.0.1 9` imprimió «succeeded!» aunque nadie escucha en el 9 **[local]**. La causa no la verifiqué. Mi hipótesis: `-z` no envía datos (la página man dice «without sending any data»), así que no hay nada que provoque el aviso. Por eso **`nc -u` no prueba nada** y no debe enseñarse.

### 4.4 DNS y TCP: cuándo

- **Lo normal es UDP 53.** RFC 1035 §4.2.1: «Messages carried by UDP are restricted to 512 bytes… Longer messages are truncated and the TC bit is set in the header» **[fuente]**.
- **TCP 53 entra** cuando la respuesta viene truncada y el cliente repite por TCP, y en las transferencias de zona («UDP is not acceptable for zone transfers») **[fuente]**.
- **512 ya no es el umbral.** EDNS(0) deja anunciar un tamaño mayor. «Values lower than 512 MUST be treated as equal to 512» (RFC 6891 §6.2.3). RFC 6891 §6.2.5 sugiere 4096 como punto de partida **[fuente]**.
- **TCP es obligatorio, no raro.** RFC 7766 §5: «All general-purpose DNS implementations MUST support both UDP and TCP transport». RFC 9210 §3: «All DNS resolvers and servers MUST support and service both UDP and TCP queries», y llama indeseable que los operadores lo bloqueen **[fuente]**.
- **AWS lo dice igual.** Para un servidor DNS en EC2: «you must ensure that TCP and UDP traffic can reach your DNS server over port 53» **[fuente]**.
- **Dentro de una VPC cambia la regla.** «You cannot filter traffic to or from the Amazon DNS server using network ACLs or security groups» (el Route 53 Resolver, en la dirección base de la VPC más 2 y en `169.254.169.253`) **[fuente]**. Una oficina sí puede filtrar el puerto 53. Una VPC no, mientras use el DNS de Amazon.
- **Para el juego:** un firewall que solo deja UDP 53 funciona con respuestas pequeñas y rompe las grandes. Es una falla rara. Sirve como incidente avanzado, no como primera lección.

### 4.5 NAT: tres cosas con el mismo nombre

| Quién | Qué hace | Fuente |
|-------|----------|--------|
| Router de la oficina | NAPT: muchas IPs privadas, una IP pública, puertos traducidos. | RFC 3022 |
| Internet gateway de AWS | NAT **uno a uno** para instancias con IPv4 pública. «The internet gateway logically provides the one-to-one NAT on behalf of your instance». | AWS «Enable internet access for a VPC using an internet gateway» **[fuente]** |
| NAT gateway de AWS | Cambia la IP de la instancia por la del NAT gateway; el Internet gateway la cambia por la Elastic IP. Tráfico: TCP, UDP e ICMP. Hasta 55 000 conexiones simultáneas por IP y por destino único (IP, puerto y protocolo). Usa los puertos 1024 a 65535. | AWS «NAT gateways» y «NAT gateway basics» **[fuente]**. Es del capítulo 6. |

Por qué la nota del borrador está simplificada:

1. **Para el Internet gateway es falsa.** AWS dice: «resources on the internet can initiate a connection to resources in your subnet using the public IPv4 address». Lo decide el Security Group **[fuente]**.
2. **Para el NAT gateway es cierta.** AWS dice que las instancias detrás de un NAT gateway «can't receive unsolicited inbound connections from the internet» **[fuente]**.
3. **En el NAT tradicional es la norma, no una ley.** «sessions are uni-directional, outbound from the private network. Sessions in the opposite direction may be allowed on an exceptional basis using static address maps» (RFC 3022 §2) **[fuente]**.
4. **El filtrado depende del NAT.** RFC 4787 (REQ-8) recomienda el filtrado independiente del destino si se prioriza la transparencia a las aplicaciones. Con él, una vez creada la traducción, otro host de internet podría enviar a ese puerto externo **[fuente]**. Esta lectura es mía.
5. **NAT no es seguridad.** «The act of translating address bits within the header does not provide security in itself» (RFC 4864 §2.2) **[fuente]**.

Redacción segura para el juego: «Un paquete que llega de fuera sin una traducción previa no sabe a qué dispositivo ir. El router lo descarta. Se puede crear una traducción fija a mano: reenvío de puertos».

### 4.6 Herramientas

- **`nc -vz IP puerto`** (TCP):
  - macOS: `-z` «should just scan for listening daemons, without sending any data to them» **[local]**.
  - ncat de Nmap: «-z Zero-I/O mode, report connection status only» **[fuente]**.
  - Resultados que el juego debe mostrar: «Connection refused» (RST) y «Operation timed out» (silencio) **[local]**.
  - Qué variante de `nc` trae Amazon Linux: **[sin verificar]**.
  - No uses `-u`.
- **`dig`:**
  - Pregunta a los servidores de `/etc/resolv.conf` y muestra el estado, por ejemplo `status: NXDOMAIN` **[local]**.
  - No lee el archivo hosts. Si `dig` dice NXDOMAIN y `ping` resuelve, mira el archivo hosts.
  - `nc` y `ping` usan el resolver del sistema, que puede leer hosts.
  - Si `dig` viene instalado en cada sistema: **[sin verificar]**. En el Mac del estudiante sí está (`/usr/bin/dig`) **[local]**.

---

## 5. Qué va fuera y a qué capítulo

| Tema | Va a | Por qué |
|------|------|---------|
| HTTP, URL, cabeceras, códigos de estado, TLS, certificados | Capítulo 3 | Ya está en su ficha. En el 2 solo se ven los números 80 y 443 como etiquetas. |
| «Con estado» (`stateful`) | Capítulo 4 | El término ya está en el registro. El capítulo 2 no lo usa, ni para hablar del NAT. |
| «Sin estado» y network ACL; rangos efímeros por sistema | Capítulo 6 | AWS: «NACLs are stateless». En el 2 solo se ve el concepto de puerto efímero. |
| Security Group que referencia a otro, Security Group default | Capítulo 4 | Son nombres de AWS. |
| Subnet, tabla de rutas de VPC (Destination, Target, local), Internet gateway como ruta, NAT gateway, Elastic IP, cinco direcciones reservadas | Capítulo 6 | Son componentes de AWS. |
| Route 53: zona alojada, Alias, políticas, health checks | Capítulo 17 | Ver respuesta 3. |
| Nombres DNS de la instancia, resolver de la VPC (`.2`) | Capítulo 4 | Lo dice la ficha del 4. |
| Atributos DNS de la VPC (`enableDnsSupport`, `enableDnsHostnames`) | Capítulo 4 o 6, a decidir | Deciden si la instancia recibe nombre DNS público y si el DNS de Amazon resuelve. |
| Conjuntos de opciones DHCP | Capítulo 6 | Se editan en la VPC. |
| DNS híbrido, endpoints del Resolver | Capítulo 25 | Ya está en su ficha. |
| Peering, VPN, GRE, IPsec (ESP, AH) | Capítulo 12 | Son conectividad entre redes. |
| Balanceadores, capas 4 y 7 | Capítulo 7 | Capas: razonamiento, no verificado. |
| IPv6, registros AAAA | Sin capítulo claro | AWS usa IPv6 desde la VPC (bloques IPv6, NAT64). El mapa de 33 capítulos no lo nombra. Decidir dónde entra. |
| `169.254.0.0/16`, servicio de metadatos, Time Sync | Capítulo 5 u 8 | AWS reserva esas direcciones. |
| NTP | Capítulo 16 | Operación. |
| Puertos 3389, 2049, 1433, 1521, 5439, 25 | Cuando aparezca su servicio | No hace falta antes. |
| MAC, ARP, switch, difusión | Fuera | Ya estaba fuera. AWS: «We do not support broadcast in a VPC». |
| OSPF, BGP, VLAN, FHRP, Wi-Fi, modelo OSI | Fuera | Los pide Network+, no AWS. |

---

## 6. Respuestas a las tres preguntas de la ficha

### Pregunta 1. ¿Qué puertos y protocolos debe ver el jugador antes del capítulo 4, y cuáles esperan?

**Antes del capítulo 4 (capítulo 2):**

- **Protocolos:** ICMP (ya del 1), **TCP** y **UDP**. Las reglas de Security Group eligen entre esos tres. AWS: «The most common protocols are 6 (TCP), 17 (UDP), and 1 (ICMP)» **[fuente]**.
- **Cómo se lee una regla:** protocolo + **rango de puertos** + origen. AWS lo llama «Protocol», «Port range» y «Source or destination» **[fuente]**. Para ICMP el «rango» es el tipo y el código.
- **Puertos como números con servicio:** 22 (SSH), 53 (DNS), 80 y 443 (web), 3306 y 5432 (bases de datos). Son los de la batería de sondas del motor.
- **Efímero:** la idea. La vuelta va al puerto de origen de la ida.
- **Direcciones:** `0.0.0.0/0`, `/32`, `/16` y pertenencia a un bloque, para 04-04.
- **Cerrado frente a filtrado.** Para 04-07 («¿portero o dueño?»).

**Esperan:**

- **HTTP y TLS** (capítulo 3): el 80 y el 443 son solo números en el 2.
- **Bases de datos** (capítulo 10): el 3306 y el 5432 son solo números en el 2.
- **Con estado y sin estado** (4 y 6).
- **Rangos efímeros por sistema** y reglas de NACL (6).
- **3389, 2049, 123, 25** y los demás puertos de Network+ (cuando aparezca el servicio).

**Qué piden los exámenes.** SAA-C03 lo pide así: «Control ports, protocols, and network traffic on AWS» y «Designing VPC architectures with security components (for example, security groups, route tables, network ACLs, NAT gateways)» **[fuente]**. Network+ lista más puertos de los que AWS usa (FTP, SFTP, SSH, Telnet, SMTP, DNS, DHCP, HTTP, HTTPS, SNMP, LDAP, RDP, SIP, según el resumen de CompTIA) **[fuente parcial]**. No hace falta enseñarlos.

### Pregunta 2. ¿Cómo se muestra el NAT del router sin modelar la tabla completa?

Propuesta: mostrar **la traducción de cada paquete y solo las filas que están en uso**.

1. **El paquete cambia a la vista.** Al cruzar el router, su etiqueta de origen pasa de `192.168.1.20:51514` a `203.0.113.5:40001`. El jugador ve el antes y el después.
2. **Una «libreta del router» con pocas filas.** Solo las traducciones de los paquetes que están en vuelo, como máximo 3 o 4. Cada fila: protocolo, IP:puerto privado, IP:puerto público. Sin tiempos, sin estados, sin límite de filas, sin grupo de IPs.
3. **La respuesta busca su fila.** Llega a `203.0.113.5:40001`. El router resalta la fila, devuelve el destino a `192.168.1.20:51514` y la entrega.
4. **Dos dispositivos a la vez.** Salen dos laptops al mismo servidor. Comparten la IP pública y se distinguen por el puerto. Es la lección entera de NAPT.
5. **Un paquete sin fila.** Llega de fuera a `203.0.113.5:40009`. No hay fila. El motivo se lee: «no sé a qué dispositivo va». Redacción segura en 4.5.
6. **Reenvío de puertos como excepción** (opcional): una fila fija que el jugador crea a mano.
7. **Del NAT del router al de AWS.** Al llegar al capítulo 4, el Internet gateway muestra la versión uno a uno: la IP privada cambia por la pública sin tocar el puerto. El NAT gateway espera al capítulo 6.

**Qué queda oculto, y debe decirse que se oculta:**

- Tiempos de vida de las filas (el UDP no baja de 2 minutos según RFC 4787 REQ-5 **[fuente]**).
- El agotamiento de puertos (en AWS, 55 000 conexiones por IP y destino **[fuente]**).
- Los tipos de mapeo y filtrado de RFC 4787.
- El identificador de ICMP como «puerto» (RFC 3022 **[fuente]**). El ping puede salir por el NAT sin mostrar la fila.

**Qué exige el motor** (solo aviso, no es parte de esta investigación): el paquete necesita un puerto de origen. Hoy `PacketSpec` solo tiene `port`, el de destino. El motivo `route-nat` solo lleva dos IPs, sin puertos.

### Pregunta 3. ¿Qué parte de DNS (registro A, resolver, caché, TTL) hace falta antes de Route 53?

**Entra en el capítulo 2:**

- Nombre de dominio, con su lectura de derecha a izquierda.
- Consulta y respuesta, UDP 53 (y TCP 53 cuando no cabe).
- **Resolver** frente a **servidor autoritativo**.
- **Registro** (nombre, tipo, valor, TTL), con **A** y **CNAME**. La regla del CNAME.
- **Caché** y **TTL** (segundos; no es el TTL de IP).
- **NXDOMAIN**, con su caché negativa, más **SERVFAIL** y «el resolver no contesta».
- Archivo hosts y la diferencia con `dig`.

**Por qué esos:** Route 53 vive de ellos. Un cambio de registro tarda lo que dura el TTL. Un NXDOMAIN que se creó hace un minuto puede seguir en caché. Un CNAME en la raíz de la zona no se puede crear y por eso Route 53 ofrece Alias.

**Espera al capítulo 17:**

- Zona alojada pública y privada. (El término «zona» también puede entrar en el 2 como apoyo; no lo propongo como núcleo.)
- Registros NS y SOA. La caché negativa usa el SOA; basta decir que existe.
- Alias, políticas de enrutamiento, health checks.
- DNSSEC, DNS Firewall, reglas del Resolver.

**Entra como nombre de AWS en el capítulo 4:** el nombre DNS público y privado de la instancia, y que el DNS de la VPC resuelve el nombre público a la IP privada desde dentro. AWS: «resolves to its public IPv4 address (outside the network of the instance) or its private IPv4 address (inside the network of the instance)» **[fuente]**.

**No hace falta antes:** la cadena de resolución raíz → TLD → autoritativo. Para el juego basta «el resolver busca por ti».

---

## 7. Qué no pude verificar

- **Objetivos oficiales de Network+ N10-009.** No conseguí el PDF oficial de CompTIA. Los enlaces probados dieron 404 o una página sin el documento. Tengo solo el resumen de la página de certificación de CompTIA, leído con una herramienta que resume (no cito números de objetivo) y una página de terceros que no da puertos. No afirmo qué objetivo cubre cada término. La retirada «hacia 2027» es una estimación de esa página, no un dato de CompTIA.
- **Vigencia de SAA-C03.** Leí la guía versión 1.1. La página de certificación de AWS no menciona SAA-C04. Búsquedas web dieron fuentes que se contradicen y no encontré aviso oficial. El [mapa de la hoja de ruta](2026-10-09-aws-roadmap-zero-to-expert.md) ya lo deja «sin confirmar».
- **Nombres exactos de los «Type» de la consola** (por ejemplo «SSH» o «Custom TCP»). Sí vi «Custom ICMP - IPv4» y «All ICMP - IPv4» en la página de reglas de ejemplo.
- **Texto exacto de errores en Linux** (`ping` sin ruta).
- **Qué hace la VPC cuando no hay ruta.** Las páginas de rutas que leí no lo dicen. Solo sé que AWS lista la tabla de rutas entre las causas de un timeout.
- **Amazon Linux:** qué `nc` y qué `dig` trae, el orden de hosts y DNS, y el rango efímero real.
- **Timeouts de TCP en Windows y macOS.** Solo tengo el RFC y el kernel de Linux.
- **Si un conjunto de opciones DHCP de AWS controla la máscara y la puerta de enlace.** La página lista DNS, dominio, NTP y NetBIOS. La IP del router la entrega el DHCP de Amazon según otra frase de la misma documentación. No encontré una frase que diga qué no se puede cambiar.
- **`/31` (RFC 3021).** No lo pude leer. `100.64.0.0/10` (RFC 6598): solo leí la línea del prefijo.
- **Si HTTP/3 usa UDP 443.** IANA lista `443/udp`; qué lo usa es conocimiento mío, no leído aquí.
- **Cachés del navegador y del sistema, y cómo las usa Node.** No las revisé.
- **Los recortes de página.** Las páginas de AWS las leí convertidas a texto. Algunas tablas pueden haber perdido formato. Las citas las comparé con ese texto.

---

## 8. Fuentes (consultadas el 2026-10-10)

### RFC e IANA

- RFC 9293, TCP. §2.2, §3.5, §3.8.3, §3.10.7.1, §4 (glosario). https://www.rfc-editor.org/rfc/rfc9293.txt
- RFC 768, UDP. https://www.rfc-editor.org/rfc/rfc768.txt
- RFC 792, ICMP (Destination Unreachable, Echo). https://www.rfc-editor.org/rfc/rfc792.txt
- RFC 1122, Requisitos de hosts. §4.1.3.1. https://www.rfc-editor.org/rfc/rfc1122.txt
- RFC 6335, Puertos de IANA. §6, §8.1.2, §9. https://www.rfc-editor.org/rfc/rfc6335.txt
- IANA, registro de nombres de servicio y puertos (CSV, actualizado 2026-10-09). https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv
- RFC 4632, CIDR. §3.1, §5.1. https://www.rfc-editor.org/rfc/rfc4632.txt
- RFC 1918, direcciones privadas. §3. https://www.rfc-editor.org/rfc/rfc1918.txt
- RFC 6598, espacio compartido. https://www.rfc-editor.org/rfc/rfc6598.txt
- RFC 3927, link-local. https://www.rfc-editor.org/rfc/rfc3927.txt
- RFC 1034 (§3.6.2) y RFC 1035 (§3.3.1, §3.4.1, §4.1.1, §4.2.1, §4.2.2). https://www.rfc-editor.org/rfc/rfc1034.txt · https://www.rfc-editor.org/rfc/rfc1035.txt
- RFC 2181 (§8, §10.1). https://www.rfc-editor.org/rfc/rfc2181.txt
- RFC 2308, caché negativa. §2.1, §2.2, §3, §5. https://www.rfc-editor.org/rfc/rfc2308.txt
- RFC 6891, EDNS(0). §6.2.3, §6.2.5. https://www.rfc-editor.org/rfc/rfc6891.txt
- RFC 7766, DNS sobre TCP (implementación). §5. https://www.rfc-editor.org/rfc/rfc7766.txt
- RFC 9210, DNS sobre TCP (operación). §3. https://www.rfc-editor.org/rfc/rfc9210.txt
- RFC 8499, terminología DNS. https://www.rfc-editor.org/rfc/rfc8499.txt
- RFC 2131 (DHCP) y RFC 2132 (opciones §3.3, §3.5, §3.8, §9.2). https://www.rfc-editor.org/rfc/rfc2131.txt · https://www.rfc-editor.org/rfc/rfc2132.txt
- RFC 3022, NAT tradicional. §2. https://www.rfc-editor.org/rfc/rfc3022.txt
- RFC 4787, comportamiento de NAT para UDP. REQ-1, REQ-5, REQ-8. https://www.rfc-editor.org/rfc/rfc4787.txt
- RFC 4864, protección de red local. §2.2. https://www.rfc-editor.org/rfc/rfc4864.txt

### Documentación de AWS

- Reglas de Security Group. https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html
- Seguimiento de conexiones. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-connection-tracking.html
- Ejemplos de reglas (ping, DNS, bases de datos). https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html
- Conceptos de tablas de rutas. https://docs.aws.amazon.com/vpc/latest/userguide/RouteTables.html
- Prioridad de rutas. https://docs.aws.amazon.com/vpc/latest/userguide/route-tables-priority.html
- Internet gateway. https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html
- NAT gateways. https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html y https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html
- DNS de Amazon (Route 53 Resolver, `.2`, cuotas). https://docs.aws.amazon.com/vpc/latest/userguide/AmazonDNS-concepts.html
- DHCP en la VPC. https://docs.aws.amazon.com/vpc/latest/userguide/VPC_DHCP_Options.html y https://docs.aws.amazon.com/vpc/latest/userguide/DHCPOptionSet.html
- Network ACL: básicos y puertos efímeros. https://docs.aws.amazon.com/vpc/latest/userguide/nacl-basics.html y https://docs.aws.amazon.com/vpc/latest/userguide/custom-network-acl.html
- Bloques CIDR de la VPC y tamaño de subredes. https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html y https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html
- VPC predeterminada (`172.31.0.0/16`, subredes /20). https://docs.aws.amazon.com/vpc/latest/userguide/default-vpc-components.html
- Solución de problemas de conexión a una instancia Linux. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/TroubleshootingInstancesConnecting.html
- Route 53, Alias frente a CNAME. https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html

### Exámenes

- Guía del examen AWS Certified Solutions Architect – Associate (SAA-C03), versión 1.1. https://d1.awsstatic.com/training-and-certification/docs-sa-assoc/AWS-Certified-Solutions-Architect-Associate_Exam-Guide.pdf
- Página de la certificación SAA. https://aws.amazon.com/certification/certified-solutions-architect-associate/
- CompTIA Network+ (resumen de objetivos N10-009, página de certificación). https://www.comptia.org/en-us/certifications/network/
- Destination Certification, «N10-009 Objectives Explained» (tercero, abril de 2026). https://destcert.com/resources/n10-009-objectives/

### Otros

- Kernel de Linux, `ip-sysctl` (`ip_local_port_range`, `tcp_syn_retries`, `icmp_ratelimit`). https://docs.kernel.org/networking/ip-sysctl.html
- Microsoft, KB 929851, rango dinámico de puertos. https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/default-dynamic-port-range-tcpip-chang
- Nmap, estados de puerto. https://nmap.org/book/man-port-scanning-basics.html
- Nmap, escaneo UDP. https://nmap.org/book/scan-methods-udp-scan.html
- Ncat, página man. https://nmap.org/book/ncat-man.html
- Node.js, `net.Server.listen`. https://nodejs.org/api/net.html
- `ip(7)`. https://man.archlinux.org/man/ip.7.en
- `hosts(5)`. https://man.archlinux.org/man/hosts.5.en

### Pruebas locales (Mac del estudiante, macOS 26.6.2, 2026-10-10)

Solo lectura y clientes. No arranqué servidores.

- `sysctl net.inet.ip.portrange.first net.inet.ip.portrange.last` → 49152 y 65535.
- `nc -vz -w 3 127.0.0.1 9` → «Connection refused».
- `nc -vzu -w 3 127.0.0.1 9` → «succeeded!». `netstat -an` no mostró escucha en el 9.
- `nc -vz -w 3 -G 2 10.255.255.1 80` → «Operation timed out».
- `dig +noall +comment localhost` → `status: NXDOMAIN`. `ping -c1 localhost` y `dscacheutil -q host -a name localhost` sí resolvieron.
- `man nc` (opción `-z`), `man dig` (`/etc/resolv.conf`) y `man 2 connect` (`ECONNREFUSED`, `ENETUNREACH`, `ETIMEDOUT`).
