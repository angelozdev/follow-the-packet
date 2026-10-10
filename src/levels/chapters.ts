export interface Tier {
  number: number;
  name: string;
}

export interface Chapter {
  number: number;
  tier: number;
  title: string;
  modules: number[];
  optional?: boolean;
}

export const TIERS: Tier[] = [
  { number: 0, name: 'Bases' },
  { number: 1, name: 'Fundamentos' },
  { number: 2, name: 'Asociado' },
  { number: 3, name: 'Profesional' },
  { number: 4, name: 'Especialista' },
];

export const CHAPTERS: Chapter[] = [
  { number: 1, tier: 0, title: 'Tu primer día', modules: [9] },
  { number: 2, tier: 0, title: 'Puertos y nombres', modules: [9] },
  { number: 3, tier: 0, title: 'La web por dentro', modules: [] },
  { number: 4, tier: 1, title: 'La noche de guardia', modules: [3, 4] },
  { number: 5, tier: 1, title: 'Tu cuenta de AWS', modules: [2, 3] },
  { number: 6, tier: 2, title: 'La VPC por dentro', modules: [9] },
  { number: 7, tier: 2, title: 'Muchos servidores, una dirección', modules: [4, 5, 9, 10] },
  { number: 8, tier: 2, title: 'Quién puede hacer qué', modules: [6, 17] },
  { number: 9, tier: 2, title: 'El bucket y el borde', modules: [6] },
  { number: 10, tier: 2, title: 'Los datos de la app', modules: [7] },
  { number: 11, tier: 2, title: 'Contenedores', modules: [8] },
  { number: 12, tier: 2, title: 'Conectar redes', modules: [9] },
  { number: 13, tier: 2, title: 'Una API sin servidores', modules: [10, 11] },
  { number: 14, tier: 2, title: 'Mensajes y eventos', modules: [11] },
  { number: 15, tier: 2, title: 'DynamoDB por dentro', modules: [12] },
  { number: 16, tier: 2, title: 'Ver lo que pasa', modules: [10, 16, 17] },
  { number: 17, tier: 2, title: 'Cuando algo cae', modules: [5, 7, 10] },
  { number: 18, tier: 2, title: 'La infraestructura en un archivo', modules: [13] },
  { number: 19, tier: 2, title: 'Del commit a producción', modules: [14, 15] },
  { number: 20, tier: 2, title: 'Proteger la app', modules: [11] },
  { number: 21, tier: 2, title: 'Costos y cuentas', modules: [4, 17] },
  { number: 22, tier: 2, title: 'Kubernetes en EKS', modules: [18, 19] },
  { number: 23, tier: 2, title: 'IA generativa en tu app', modules: [] },
  { number: 24, tier: 2, title: 'Datos en movimiento', modules: [], optional: true },
  { number: 25, tier: 3, title: 'Redes a escala', modules: [] },
  { number: 26, tier: 3, title: 'Una organización, muchas cuentas', modules: [17] },
  { number: 27, tier: 3, title: 'Varias Regiones', modules: [] },
  { number: 28, tier: 3, title: 'La guardia automática', modules: [14, 16] },
  { number: 29, tier: 3, title: 'La mudanza', modules: [10] },
  { number: 30, tier: 3, title: 'IA generativa en producción', modules: [] },
  { number: 31, tier: 3, title: 'Revisión de arquitectura', modules: [10, 20] },
  { number: 32, tier: 4, title: 'La noche del ataque', modules: [] },
  { number: 33, tier: 4, title: 'Redes avanzadas', modules: [] },
];
