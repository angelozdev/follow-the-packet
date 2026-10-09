const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isIpv4(value: string): boolean {
  const m = IPV4.exec(value);
  return m !== null && m.slice(1).every((part) => Number(part) <= 255);
}

export function ipToInt(ip: string): number {
  if (!isIpv4(ip)) throw new Error(`invalid IP: ${ip}`);
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

const PRIVATE_RANGES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

/** True when the whole range lies inside one private range of RFC 1918 (10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16). */
export function isPrivateCidr(cidr: string): boolean {
  const { prefix } = parseCidr(cidr);
  const [base] = cidr.split('/');
  return PRIVATE_RANGES.some((range) => prefix >= parseCidr(range).prefix && ipInCidr(base, range));
}
