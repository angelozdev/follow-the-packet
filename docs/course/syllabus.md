# Pensum — AWS Commit Academy

Estados: `[ ]` pendiente · `[x]` vista · `[x] … · verificada` pasó la verificación del copiloto.

Solo se enlaza lo que existe: conceptos, artefactos y labs se añaden a cada línea cuando se crean.

## 1. Introducción

- [x] Bienvenida
- [x] Qué vas a aprender - Temario
- [x] Cómo seguir el curso
- [x] Utilizar la IA como herramienta de Aprendizaje

## 2. Fundamentos de Cloud Computing y AWS

- [x] Fundamentos del Cloud Computing
- [x] Qué es el Cloud Computing
- [x] Historia del Cloud
- [x] Casos de Uso
- [x] Examen: Fundamentos del Cloud Computing
- [x] Modelos de Servicio → [artefacto 01](artifacts/01-shared-responsibility.html)
- [x] Modelos de Despliegue
- [x] Modelo de Responsabilidad Compartida → [artefacto 01](artifacts/01-shared-responsibility.html)
- [x] Examen: Fundamentos de Cloud Computing: Modelos de Servicio y Despliegue

## 3. Introducción a AWS

- [x] Qué es AWS
- [x] Modelo de precios
- [x] Regiones, zonas de disponibilidad → [artefacto 02](artifacts/02-region-az-edge.html)
- [x] Sistemas de computado → [artefacto 03](artifacts/03-compute-in-action.html)
- [x] Examen: Fundamentos de AWS: Infraestructura y Modelo de Precios
- [x] Storage → [S3](concepts/s3.md) · [artefacto 04](artifacts/04-ebs-efs-s3.html)
- [x] Bases de datos → [artefacto 05](artifacts/05-databases.html)
- [x] Networking → [artefacto 06](artifacts/06-aws-in-motion.html)
- [x] Examen: Storage, Bases de Datos y Networking en AWS
- [x] Consola de AWS
- [x] AWS CLI
- [x] Lab: Acceso al Dashboard de AWS e Instalación de AWS CLI → [lab 01](labs/01-dashboard-cli/README.md)

## 4. Infraestructura Tradicional y Compute Clásico (IaaS)

- [x] Introducción
- [ ] Presentación de AWS EC2 → [artefacto 07](artifacts/07-black-friday-scaling.html)
- [x] Lab: Despliegue de una Instancia EC2 → [lab 02](labs/02-deploy-ec2-instance/README.md) · [EC2](concepts/ec2.md)
- [x] Tipos de instancias EC2 → [EC2](concepts/ec2.md) · [artefacto 08](artifacts/08-ec2-instance-types.html) · [artefacto 09](artifacts/09-cpu-architecture.html)
- [ ] Examen: Tipos de instancias EC2: Nomenclatura y casos de uso
- [x] Security Groups → [Security Groups](concepts/security-groups.md) · [artefacto 10](artifacts/10-security-groups.html) · [práctica 01](exercises/01-security-groups/README.md)
- [ ] Buenas Prácticas de Security Groups
- [ ] Key Pairs y Security Groups en la práctica
- [ ] Lab: Comprobación de Conectividad entre Instancias EC2 usando PING → [lab 03](labs/03-ping-connectivity/README.md) · [Security Groups](concepts/security-groups.md)
- [ ] Examen: Security Groups y Key Pairs en AWS EC2
- [ ] ¿Qué son las AMI?
- [ ] AMI en detalle
- [ ] Creación de AMIs personalizadas
- [x] Lab: Creación de AMIs personalizadas → [lab 04](labs/04-custom-ami/README.md) · [EC2](concepts/ec2.md) · [AMI](concepts/ami.md)
- [ ] Examen: Amazon Machine Images (AMI) - Conceptos y Creación
- [ ] UserData: Ejecución de Scripts en EC2
- [ ] Metadata en EC2
- [x] Introducción a EBS · verificada → [EBS](concepts/ebs.md)
- [x] Tipos de Volúmenes EBS → [EBS](concepts/ebs.md)
- [x] Attach de volúmenes a instancias · verificada → [EBS](concepts/ebs.md)
- [x] Snapshots en Amazon EBS → [EBS](concepts/ebs.md) · [práctica 02](exercises/02-ebs-volumes/README.md)
- [x] Examen: Amazon EBS: Volúmenes y Snapshots
- [ ] Modelos de Pricing en EC2

## 5. Alta disponibilidad en EC2

- [x] Introducción a los Elastic Load Balancers · verificada → [Load Balancing](concepts/load-balancing.md)
- [x] Conceptos Fundamentales de Load Balancers → [Load Balancing](concepts/load-balancing.md)
- [x] Health Checks · verificada → [Load Balancing](concepts/load-balancing.md) · [práctica 03](exercises/03-alb-health-checks/README.md)
- [x] Cross Zone Load Balancing · verificada → [Load Balancing](concepts/load-balancing.md)
- [x] Examen: Elastic Load Balancers: Conceptos Fundamentales
- [ ] Creación de un Load Balancer en AWS
- [ ] Introducción a los Grupos de Autoescalado → [Auto Scaling](concepts/auto-scaling.md)
- [ ] Políticas de Escalado Avanzadas
- [x] Lab: Alta Disponibilidad con ALB + Auto Scaling + IMDSv2 → [lab 05](labs/05-ha-alb-asg-imdsv2/README.md) · [Auto Scaling](concepts/auto-scaling.md) · [Load Balancing](concepts/load-balancing.md) · [IMDS](concepts/imds.md)
- [ ] Examen: Grupos de Autoescalado y Políticas de Escalado en AWS

## 6. Almacenamiento con S3 y CloudFront

_Disponible el 10 oct 2026_

- [ ] Introducción al Almacenamiento
- [ ] Conceptos Básicos de Amazon S3 → [S3](concepts/s3.md)
- [ ] Atributos de los objetos en S3 → [S3](concepts/s3.md)
- [ ] Examen: Introducción al Almacenamiento en AWS y Amazon S3
- [ ] Creación de un Bucket S3 y Gestión de Objetos
- [ ] Modelo de Precios en Amazon S3
- [ ] Configuración de Seguridad → [S3](concepts/s3.md)
- [ ] Políticas en AWS: Conceptos Fundamentales → [Políticas de IAM](concepts/iam-policies.md)
- [x] Examen: Configuración de Seguridad y Políticas en AWS S3
- [ ] Versionado de S3
- [ ] Ciclo de vida de los objetos en S3 → [S3](concepts/s3.md)
- [ ] Hosting de Páginas Web Estáticas → [S3](concepts/s3.md) · [CloudFront](concepts/cloudfront.md)
- [ ] ¿Qué es CloudFront? → [CloudFront](concepts/cloudfront.md)
- [ ] Flujo de una petición con CloudFront → [CloudFront](concepts/cloudfront.md)
- [x] Examen: CloudFront: CDN y Distribución de Contenido → [CloudFront](concepts/cloudfront.md)
- [ ] Distribución con CloudFront y S3 → [CloudFront](concepts/cloudfront.md)
- [ ] Configuración de CloudFront con S3
- [ ] Comportamiento de la caché en CloudFront → [CloudFront](concepts/cloudfront.md)
- [ ] Examen: CloudFront y S3: Distribución y Configuración de Caché
- [ ] ¿Qué son las funciones Edge?
- [ ] Modelo de Precios de CloudFront
- [ ] Lab: Publicar una Web Estática con S3 y CloudFront → [S3](concepts/s3.md) · [CloudFront](concepts/cloudfront.md) · [lab 06](labs/06-static-site-s3-cloudfront/README.md)
- [ ] Integración de S3 en aplicaciones con TypeScript → [S3](concepts/s3.md)
- [ ] Recapitulación de S3 y CloudFront

## 7. Bases de Datos con RDS

_Disponible el 17 oct 2026_

- [ ] Introducción a las bases de datos relacionales → [ACID y CAP](concepts/acid-cap.md) · [artefacto 11](artifacts/11-acid.html)
- [ ] Configuración de bases de datos en Amazon RDS
- [ ] Creación de una Base de Datos en Amazon RDS
- [ ] Examen: Amazon RDS y Bases de Datos Relacionales
- [ ] Motores de Base de Datos en RDS → [RDS](concepts/rds.md)
- [ ] Lab: Acceso Privado a Base de Datos RDS desde una Instancia EC2
- [ ] Estrategias de Backup y Recuperación en Bases de Datos
- [ ] Examen: Motores de Base de Datos en RDS y Estrategias de Backup
- [ ] Múltiples Zonas de Disponibilidad (Multi-AZ)
- [ ] Réplicas de Lectura en RDS
- [ ] Examen: Multi-AZ y Réplicas de Lectura en RDS
- [ ] Panorama de Servicios de Almacenamiento en AWS

## 8. Contenedores

_Disponible el 24 oct 2026_

- [ ] Introducción a los Contenedores
- [ ] Instalar Docker en tu máquina
- [ ] ¿Qué problema resuelve Docker?
- [ ] Fundamentos de Docker: Namespaces, Cgroups y OverlayFS
- [ ] Examen: Fundamentos de Docker: Namespaces, Cgroups y OverlayFS
- [ ] Introducción a los Dockerfiles
- [ ] Dockerfile Multistage
- [ ] Examen: Dockerfiles y Construcción Multistage
- [ ] ¿Qué es un Registry de Contenedores?
- [ ] Lab: Crear y Publicar una Imagen Docker en Amazon ECR
- [ ] ¿Qué es Amazon ECS?
- [ ] Conceptos Fundamentales de ECS
- [ ] Modos de ejecución de contenedores en ECS
- [ ] Examen: Fundamentos de Amazon ECS: Conceptos y Modos de Ejecución
- [ ] Introducción al Autoescalado
- [ ] Examen: Introducción al Autoescalado en ECS
- [ ] Amazon ECS en la práctica
- [ ] Lab: Desplegar una Aplicación en ECS usando Fargate

## 9. Redes y Arquitectura en AWS

_Disponible el 31 oct 2026_

- [ ] Introducción al Networking en la Nube
- [ ] Fundamentos de Redes
- [ ] Direcciones IP: Fundamento de la Comunicación en Red
- [ ] Puertos de Red y Protocolos
- [ ] Enrutado
- [ ] DNS
- [ ] Examen: Fundamentos de Redes y Comunicación
- [ ] Introducción a las VPCs en AWS
- [ ] Conceptos fundamentales de subredes
- [ ] Tablas de Rutas en AWS
- [ ] Internet Gateway, Nat Gateway y EIP
- [ ] Examen: Fundamentos de Redes en AWS: Subredes, Rutas y Gateways
- [ ] Network ACL
- [ ] Optimización del tráfico interno con VPC Endpoints
- [ ] ¿Qué es VPC Peering?
- [ ] Transit Gateway
- [ ] Examen: Seguridad y Conectividad Avanzada en AWS VPC
- [ ] Diseño visual de Arquitecturas de Red
- [ ] Lab: Diseño de una VPC de Producción para Cumplimiento y Alta Disponibilidad
- [ ] Funcionamiento del Network Load Balancer (NLB)

## 10. Principios de Diseño Cloud Native

_Disponible el 8 nov 2026_

- [ ] Introducción al desarrollo Cloud-Native
- [ ] AWS Well-Architected Framework
- [ ] Introducción a los 12 Factores
- [ ] Examen: Desarrollo Cloud-Native: Well-Architected Framework y 12 Factores
- [ ] Codebase: Un repositorio, múltiples despliegues
- [ ] Configuración y Servicios
- [ ] Procesos Stateless
- [ ] Escalabilidad Nativa en Cloud
- [ ] Programación tolerante a fallos
- [ ] Observabilidad y Logs
- [ ] Examen: Principios de Aplicaciones Cloud Native
- [ ] Arquitecturas de Software: Monolitos vs Microservicios
- [ ] API Gateway y Patrones de Microservicios
- [ ] Lab: Identificación de errores en aplicaciones cloud
- [ ] Estrategias de Migración al Cloud

## 11. Arquitecturas Cloud Native y Serverless

_Disponible el 15 nov 2026_

- [ ] Introducción a las Arquitecturas Serverless
- [ ] Sincronía vs Asincronía
- [ ] Arquitecturas Event-Driven
- [ ] Servicios Serverless
- [ ] Lambda
- [ ] API Gateway
- [ ] Lab: API Serverless de Cotización con AWS Lambda y API Gateway
- [ ] Authorizers, Usage Plans y API Keys
- [ ] Simple Queue Service (SQS)
- [ ] Conceptos avanzados de SQS
- [ ] Simple Notification Service (SNS)
- [ ] Patrones en SNS y ejemplos de código
- [ ] Introducción a EventBridge
- [ ] Examen: Servicios de Mensajería y Eventos en AWS
- [ ] Métodos de invocación de Lambda
- [ ] Escalabilidad de Lambda
- [ ] Lambda Aliases y Versions
- [ ] Patrones de Mensajería
- [ ] Lab: Sistema de Notificaciones con SNS y AWS Lambda
- [ ] Otros servicios
- [ ] Step Functions
- [ ] Patrones de Arquitectura Serverless
- [ ] Examen: Patrones de Mensajería y Arquitectura Serverless en AWS

## 12. DynamoDB

_Disponible el 22 nov 2026_

- [ ] Introducción a DynamoDB
- [ ] Por qué DynamoDB
- [ ] Características principales de DynamoDB
- [ ] Operaciones en DynamoDB
- [ ] Expression Attribute Names y Values
- [ ] Patrones de Acceso
- [ ] Diseño de Tabla Única
- [ ] Ejemplo Práctico de DynamoDB
- [ ] Lab: Modelado de datos sencillo en DynamoDB
- [ ] Relaciones N:M en DynamoDB
- [ ] GSI y LSI
- [ ] Lab: Modelado de una plataforma de cursos en DynamoDB
- [ ] Optimización y análisis del rendimiento
- [ ] DynamoDB Streams
- [ ] Global Tables
- [ ] Time to Live (TTL), Transacciones y Backups
- [ ] Examen: Quiz de Amazon DynamoDB

## 13. Infraestructura como Código (IaC)

_Disponible el 29 nov 2026_

- [ ] Infraestructura Artesanal vs Infraestructura como Código
- [ ] ¿Qué es Terraform?
- [ ] Providers
- [ ] Variables
- [ ] Introducción a los Módulos
- [ ] Gestión del Estado
- [ ] Buenas prácticas en IaC
- [ ] Revisión de Código y Aprobación de Cambios
- [ ] Despliegue de AWS Lambda con Terraform
- [ ] Lab: Despliegue de una API sencilla con Lambda y API Gateway usando Terraform

## 14. CI/CD y Despliegue de Aplicaciones

_Disponible el 6 dic 2026_

- [ ] Introducción a DevOps y CI/CD
- [ ] ¿Qué es DevOps?
- [ ] Métricas DORA
- [ ] Examen: Fundamentos de DevOps y Métricas DORA
- [ ] Flujos de trabajo con Git
- [ ] Integración y Despliegue Continuo (CI/CD)
- [ ] Examen: Flujos de trabajo con Git y CI/CD
- [ ] AWS Developer Tools para CI/CD
- [ ] AWS CodeBuild
- [ ] Orquestación de CI/CD con CodePipeline
- [ ] Blue Green Deployments
- [ ] Canary Deployments
- [ ] Rollbacks en Sistemas de Despliegue
- [ ] Introducción a CodeDeploy
- [ ] Hooks en AWS CodeDeploy
- [ ] Introducción a GitHub Actions
- [ ] Configuración de GitHub Actions con AWS
- [ ] Lab: Pipeline CI/CD con GitHub Actions
- [ ] Introducción a GitOps

## 15. Introducción a Git (opcional)

_Disponible el 6 dic 2026_

- [ ] Git: Sistema de Control de Versiones para Desarrolladores
- [ ] Primeros pasos con Git: init, add y commit
- [ ] Git Local y Remoto: Sincronización con GitHub
- [ ] .gitignore: Protege tus archivos sensibles en Git
- [ ] Git Branches: Bifurcaciones y Trabajo en Equipo
- [ ] Git Merge y Resolución de Conflictos
- [ ] Git Clone: Descarga de Repositorios Remotos

## 16. Observabilidad y Operaciones

_Disponible el 13 dic 2026_

- [ ] CloudWatch: La Suite de Observabilidad de AWS
- [ ] Introducción a CloudWatch Logs
- [ ] Métricas en CloudWatch
- [ ] Embedded Metric Format (EMF)
- [ ] Examen: CloudWatch: Logs, Métricas y EMF
- [ ] Creación de Alarmas
- [ ] Severidad de las Alarmas
- [ ] Construcción de Dashboards
- [ ] AWS X-Ray y Trazabilidad
- [ ] OpenTelemetry en AWS
- [ ] Instrumentación de Lambdas con OpenTelemetry
- [ ] Indicadores de Nivel de Servicio
- [ ] Examen: Alarmas y Niveles de Servicio en CloudWatch

## 17. Seguridad, Gobernanza y FinOps

_Disponible el 20 dic 2026_

- [ ] Introducción a IAM
- [ ] Tipos de Identidades y Ciclo de Vida
- [ ] Condiciones en Políticas de IAM
- [ ] Examen: Fundamentos de IAM en AWS
- [ ] Gestión de Múltiples Cuentas en AWS
- [ ] Limitando acciones con Service Control Policies (SCPs)
- [ ] ¿Qué es AWS CloudTrail?
- [ ] AWS Config: Inventario y Análisis de Configuración
- [ ] ¿Qué es FinOps?
- [ ] Visibilidad de Costes en AWS
- [ ] Gestión de Presupuestos
- [ ] Palancas de Optimización de Costes
- [ ] Examen: Fundamentos de FinOps y Optimización de Costes en AWS

## 18. Kubernetes

_Disponible el 27 dic 2026_

- [ ] La era pre-Kubernetes
- [ ] Introducción a Kubernetes
- [ ] ¿Qué son los Pods?
- [ ] Deployments y ReplicaSets
- [ ] Gestión de Deployments y Rollbacks
- [ ] Examen: Fundamentos de Kubernetes: Pods, Deployments y ReplicaSets
- [ ] Introducción a los StatefulSets
- [ ] Jobs y CronJobs
- [ ] ¿Qué son los Services?
- [ ] Lab: Despliegue de una Aplicación en Kubernetes
- [ ] ConfigMaps y Secrets
- [ ] Namespaces en Kubernetes
- [ ] Sistema de Control de Acceso Basado en Roles (RBAC)
- [ ] Introducción a los volúmenes
- [ ] Scheduling Avanzado

## 19. Kubernetes en AWS (EKS)

_Disponible el 27 dic 2026_

Lecciones aún no publicadas en el temario.

## 20. Proyecto Final

_Disponible el 3 ene 2027_

- [ ] Recorrido por el curso
- [ ] Introducción al Proyecto Final
- [ ] Lab: Proyecto Final de Curso
- [ ] Obtención del Certificado

## Clases magistrales (opcionales)

### Bash Scripting

_Disponible el 4 oct 2026_

- [ ] Introducción a Bash

### GitHub Actions Agéntico

_Disponible el 6 dic 2026_

- [ ] GitHub Agentic Workflows

### Observabilidad con Dynatrace

_Disponible el 13 dic 2026_

- [ ] Observabilidad con Dynatrace

### IA Generativa con AWS Bedrock

Sin fecha ni lecciones publicadas en el temario.

## Directos de seguimiento y dudas

- [ ] Directo de Bienvenida (opcional)
