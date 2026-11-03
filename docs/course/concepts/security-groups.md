# Security Groups

> Problema que resuelve: un recurso con IP alcanzable queda expuesto en todos los puertos que escucha; el Security Group reduce esa superficie de ataque a solo el tráfico que tú autorizas.

## Qué es

Un **Security Group (SG)** es un firewall virtual asociado a la **interfaz de red (ENI)** de un recurso: una instancia EC2, una base de datos RDS, un balanceador de carga o una Lambda dentro de una VPC. Se crea en una VPC y se asigna a recursos de esa VPC; a otras VPCs de la misma región solo con la función *Security Group VPC Association*.

- **Superficie de ataque:** el conjunto de puntos por donde alguien puede intentar entrar (cada puerto que escucha y es alcanzable).
- **Regla:** protocolo (TCP, UDP, ICMP) + puerto o rango de puertos + **origen** (reglas de entrada) o **destino** (reglas de salida).
- **Origen/destino posibles:** un CIDR IPv4 o IPv6, el ID de otro Security Group o el ID de una *prefix list* (lista de CIDRs con nombre).
- **SG nuevo:** sin reglas de entrada (no entra nada) y con una regla de salida que permite todo.
- Los cambios en las reglas se aplican de inmediato a todos los recursos asociados.

### CIDR

Notación para escribir un **rango de IPs** como `IP/número`. Una IPv4 tiene 32 bits; el número después de la `/` dice cuántos bits de la izquierda quedan fijos. Cantidad de direcciones: 2^(32 − número). Número más chico = rango más grande.

| CIDR | Rango | Direcciones |
|---|---|---|
| `203.0.113.5/32` | solo esa IP | 1 |
| `10.0.1.0/24` | `10.0.1.0` – `10.0.1.255` | 256 |
| `10.0.0.0/16` | `10.0.0.0` – `10.0.255.255` | 65 536 |
| `0.0.0.0/0` | todas las IPv4 | todo internet |

Sirve porque las IPs se reparten por bloques: una red (oficina, VPC, subred) comparte el inicio de la IP. Se usa para diseñar la VPC y sus subredes, en reglas de SG y NACL, y en tablas de rutas (`0.0.0.0/0 → Internet Gateway`). Un CIDR describe **dónde está** una máquina, no **qué es**.

### Stateful

El SG registra cada conexión que deja pasar. Las reglas solo deciden el **primer paquete** de una conexión; las respuestas pasan sin evaluar reglas.

- Conexión que viene de afuera → la decide una regla de **entrada**.
- Conexión que inicia el recurso (p. ej. `dnf update`) → la decide una regla de **salida**.

### Solo permite

No existen reglas de denegar. Lo que ninguna regla permite queda bloqueado. Para bloquear una IP concreta:

| | Security Group | Network ACL (NACL) |
|---|---|---|
| Se aplica a | interfaz de red | subred completa |
| Estado | stateful | stateless: no recuerda conexiones, hay que permitir ambos sentidos |
| Reglas | solo permitir | permitir y denegar |
| Evaluación | todas las reglas juntas | en orden por número; gana la primera que coincide |

**AWS WAF** (firewall de aplicación web) filtra peticiones HTTP delante de un ALB, CloudFront o API Gateway; no se conecta directamente a una instancia.

### Varios SGs en un recurso

Las reglas de todos los SGs asociados se **suman** en una sola lista. Basta con que una regla permita el tráfico. Más SGs = más permisos, nunca menos.

### Un SG como origen (referencia)

Una regla con origen = otro SG permite el tráfico de toda interfaz de red que lleve asociado ese SG, sin importar su IP. Patrón de 3 capas:

```
internet ──443──▶ sg-alb ──8080──▶ sg-app ──5432──▶ sg-db
         origen:          origen:          origen:
         0.0.0.0/0        sg-alb           sg-app
```

Las instancias nuevas de un Auto Scaling group reciben `sg-app` por la launch template y entran solas; las que no lo llevan no entran aunque estén en la misma subred.

## Cuándo sí / cuándo no

- **Origen = CIDR:** tráfico desde fuera de AWS (tu laptop con `/32`, la red de una oficina, un cliente). Lo de afuera no lleva SG; la IP es lo único que lo identifica.
- **Origen = otro SG:** tráfico entre recursos de tu VPC (o VPCs conectadas por peering o transit gateway). Sus IPs cambian y un CIDR incluiría a los vecinos de subred.
- **SG vs NACL:** el SG es el control principal y por recurso. El NACL se usa para denegar explícitamente (bloquear una IP o un rango) a nivel de subred.
- **Acceso de administración:** no abras 22 (SSH) ni 3389 (RDP) a `0.0.0.0/0`. Mejor **Session Manager** (AWS Systems Manager): el SSM Agent de la instancia abre una conexión de salida HTTPS al servicio, IAM autentica al usuario y el SG queda sin reglas de entrada. Requiere un rol de IAM con `AmazonSSMManagedInstanceCore` y salida 443.

## Trade-offs y costos

- Los SGs no tienen costo.
- La referencia a otro SG solo aplica al tráfico por **IPs privadas**. Si la app llama a la base de datos por su IP pública, la regla no coincide.
- Un SG bloquea en silencio: una conexión no permitida da **timeout**, no "connection refused". "Connection refused" significa que el paquete llegó pero nadie escucha en ese puerto.
  - **Descartar** (*drop*): el paquete se tira sin responder nada; el cliente espera hasta su timeout. Así actúa un SG. **Rechazar** (*reject*): el receptor contesta "no", y el cliente se entera al instante. Un 401/403/404 de un backend es un rechazo a nivel de aplicación: la petición ya pasó el SG, abrió la conexión TCP y llegó al código.
  - En Node: `ETIMEDOUT` → buscar en SG, NACL o rutas; `ECONNREFUSED` → llegó a la máquina, revisar si el proceso corre y en qué puerto escucha (escuchar en `127.0.0.1` en vez de `0.0.0.0` lo deja inaccesible desde fuera); un código HTTP → llegó a tu app, revisar código y logs.
  - Se descarta en vez de rechazar para no dar información (un escáner no distingue "hay máquina pero bloqueada" de "no hay nada") y para no generar tráfico de respuesta a peticiones no deseadas. El costo: depurar es más lento, porque un timeout no dice dónde se perdió el paquete.
- Una regla con "My IP" (`/32`) queda desactualizada cuando cambia tu IP pública (ver [EC2](ec2.md)).
- **Borrar una regla no corta las conversaciones que ya pasaron.** El SG recuerda cada conexión que dejó pasar (*connection tracking*) y la sigue permitiendo hasta que se queda inactiva el tiempo de espera: TCP establecida, 432000 s (5 días) por defecto en la mayoría de tipos de instancia, 350 s en Nitro v6. ICMP siempre se rastrea. Mientras haya tráfico, no expira. En un incidente, quitar la regla no echa a quien ya está dentro: para cortar al instante, AWS indica un NACL (stateless). Excepción: un flujo TCP/UDP permitido con `0.0.0.0/0` en ambas direcciones no se rastrea y se corta en cuanto se quita la regla. Visto en el lab 03 (V7): el `ping` siguió respondiendo después de borrar la regla ICMP.
- Cuotas por defecto (por región): 2500 SGs; 60 reglas de entrada + 60 de salida por SG (por separado para IPv4 e IPv6); 5 SGs por interfaz de red (ampliable hasta 16). Reglas por SG × SGs por interfaz ≤ 1000.
- Buenas prácticas: un SG por función (`alb`, `app`, `db`), mínimo privilegio (dar solo el acceso estrictamente necesario), no usar el SG `default` para tus recursos, descripción en cada regla, borrar los SGs huérfanos (`launch-wizard-N`).

## Lo que me costó

Verificación del 2026-10-06:

- **Describí qué hace, no qué problema evita.** Dije "controla qué entra y qué sale". Faltaba el problema (superficie de ataque) y el criterio de cada regla (protocolo + puerto + origen/destino).
- **No entendía el flujo de ida y vuelta.** Con pista llegué a que las respuestas no necesitan regla de salida porque el SG es stateful.
- **Creí que un SG podía bloquear una IP concreta.** No: solo permite. Para denegar se usa un NACL o WAF.
- **Para la base de datos propuse un rango de IPs y luego un tag.** Lo correcto es un SG como origen. Un rango incluye a cualquier recurso de la subred, y las reglas de SG no aceptan tags.
- **No sabía qué era un CIDR.** Ver la sección CIDR arriba.
- **Pensé que con dos SGs, uno sin reglas, se perdía el SSH.** No: las reglas se suman. Y mi laptop no lleva SG; el SG va en el destino.
- **Propuse un SG para la laptop de alguien con IP cambiante.** Lo de afuera de AWS no lleva SG; la alternativa es Session Manager.

Práctica 01 (2026-10-06):

- **Corrí `curl` a una IP privada desde mi laptop** y lo interpreté como un bloqueo del SG. Una IP privada solo existe dentro de la VPC; el timeout era de ruta. Antes de concluir, confirmar desde dónde corre el comando (`hostname`, o `curl -v`, que muestra la IP de origen).
- **Creí que Session Manager funcionaba "por el rol".** El rol autoriza al agente; el tráfico pasa porque el agente inicia una conexión de salida y el SG es stateful.
- **Predije que la app seguiría llegando a la db tras quitarle `practica01-app`, "porque ambos SGs tienen salida".** Miré solo la salida del origen. Decide la entrada del destino.
- **En el NACL vi el Deny pero no el orden.** Las reglas se evalúan por número, gana la primera que coincide, y la regla `*` deniega todo lo demás.

Lab 03 (2026-10-07):

- **Mezclé el "qué" con el "desde dónde" tres veces.** Creí que un `ping` desde mi Mac pasaría porque mi IP está en la regla de SSH; respondí "desde mi IP" cuando la pregunta era el tipo de ICMP; elegí `Custom ICMP` "porque deja limitar a mi IP". Type y Source son columnas independientes: el paquete tiene que coincidir con las dos, y cualquier Type se combina con cualquier Source.
- **Otra vez miré la salida en vez de la entrada del destino.** Dije que el `ping` necesitaba una regla de salida en `servidor2` porque es el que responde. Lo primero que viaja es el Echo Request, que *entra* a `servidor2`; si no entra, no hay nada que responder. Mismo hueco que en la práctica 01.
- **ICMP era nuevo para mí.** Es un solo protocolo con muchos tipos de mensaje, como HTTP con sus códigos de estado. Para `ping` bastan dos: Echo Request y Echo Reply.
- **Bien:** elegí el SG de `servidor1` como origen porque una IP cambia cuando Auto Scaling reemplaza instancias.

## Fuentes

- Reglas de Security Group (solo permitir, suma de reglas, tipos de origen, referencia por IP privada): <https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html> (consultada el 2026-10-06)
- Cuotas de Amazon VPC (SGs por región, reglas por SG, SGs por interfaz): <https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html> (consultada el 2026-10-06)
- Precio de Session Manager en EC2 ("No additional charges for usage on Amazon EC2 instances"): <https://aws.amazon.com/systems-manager/pricing/> (consultada el 2026-10-06)
- Security Groups (visión general, stateful, asociación a otras VPCs): <https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html> (consultada el 2026-10-06)
- Connection tracking (conexiones rastreadas no se interrumpen al cambiar una regla; timeouts; ICMP siempre rastreado; NACL para cortar al instante): <https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-connection-tracking.html> (consultada el 2026-10-07)
- Network ACLs (stateless, evaluación por número, gana la primera que coincide): <https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html> y <https://docs.aws.amazon.com/vpc/latest/userguide/nacl-rules.html> (consultadas el 2026-10-06)

## Visto en

- Lección del pensum: Security Groups ([syllabus](../syllabus.md))
- [Artefacto 10: Security Groups en acción](../artifacts/10-security-groups.html) (https://claude.ai/artifact/3njEr1rDdSMiGRt1kZUuJh)
- [Práctica 01: Security Groups en la práctica](../exercises/01-security-groups/README.md)
- [Lab 02: Despliegue de una instancia EC2](../labs/02-deploy-ec2-instance/README.md) (SG `launch-wizard-1` con SSH desde "My IP")
- [Lab 03: Conectividad entre instancias EC2 con PING](../labs/03-ping-connectivity/README.md) (en curso)
- Nota relacionada: [EC2](ec2.md)
