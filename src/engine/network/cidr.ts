const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isIpv4(value: string): boolean {
  const m = IPV4.exec(value);
  return m !== null && m.slice(1).every((part) => Number(part) <= 255);
}

export function ipToInt(ip: string): number {
  if (!isIpv4(ip)) throw new Error(`invalid IP: ${ip}`);
  // Aritmética en vez de operadores de bits: evita el signo de los enteros de 32 bits.
  return ip.split('.').reduce((acc, part) => acc * 256 + Number(part), 0);
}

const CIDR = /^([\d.]+)\/(\d{1,2})$/;

export function parseCidr(cidr: string): { base: number; prefix: number } {
  const match = CIDR.exec(cidr);
  const prefix = Number(match?.[2]);
  if (!match || !isIpv4(match[1]) || prefix > 32) throw new Error(`invalid CIDR: ${cidr}`);
  return { base: ipToInt(match[1]), prefix };
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const { base, prefix } = parseCidr(cidr);
  const size = 2 ** (32 - prefix);
  const start = Math.floor(base / size) * size;
  const value = ipToInt(ip);
  return value >= start && value < start + size;
}
