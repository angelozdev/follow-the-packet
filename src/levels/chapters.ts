export interface Chapter {
  number: number;
  title: string;
}

export const CHAPTERS: Chapter[] = [
  { number: 1, title: 'Introducción' },
  { number: 2, title: 'Fundamentos de Cloud Computing y AWS' },
  { number: 3, title: 'Introducción a AWS' },
  { number: 4, title: 'Infraestructura Tradicional y Compute Clásico (IaaS)' },
  { number: 5, title: 'Alta disponibilidad en EC2' },
  { number: 6, title: 'Almacenamiento con S3 y CloudFront' },
  { number: 7, title: 'Bases de Datos con RDS' },
  { number: 8, title: 'Contenedores' },
  { number: 9, title: 'Redes y Arquitectura en AWS' },
  { number: 10, title: 'Principios de Diseño Cloud Native' },
  { number: 11, title: 'Arquitecturas Cloud Native y Serverless' },
  { number: 12, title: 'DynamoDB' },
  { number: 13, title: 'Infraestructura como Código (IaC)' },
  { number: 14, title: 'CI/CD y Despliegue de Aplicaciones' },
  { number: 15, title: 'Introducción a Git (opcional)' },
  { number: 16, title: 'Observabilidad y Operaciones' },
  { number: 17, title: 'Seguridad, Gobernanza y FinOps' },
  { number: 18, title: 'Kubernetes' },
  { number: 19, title: 'Kubernetes en AWS (EKS)' },
  { number: 20, title: 'Proyecto Final' },
];
