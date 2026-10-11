export const LOOPBACK_IP = '127.0.0.1';
const LOOPBACK_RANGE = '127.0.0.0/8';

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

/** Returns the range of the given prefix that holds the IP, written with its first address: 198.51.100.1 with 24 gives 198.51.100.0/24. */
export function networkOf(ip: string, prefix: number): string {
  const size = 2 ** (32 - prefix);
  const start = Math.floor(ipToInt(ip) / size) * size;
  return `${[24, 16, 8, 0].map((shift) => Math.floor(start / 2 ** shift) % 256).join('.')}/${prefix}`;
}

const PRIVATE_RANGES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

/** True when the IPv4 address is in a private range of RFC 1918, which the internet does not deliver. */
export function isPrivateIpv4(ip: string): boolean {
  return PRIVATE_RANGES.some((range) => ipInCidr(ip, range));
}

/** True when the whole range lies inside one private range of RFC 1918 (10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16). */
export function isPrivateCidr(cidr: string): boolean {
  const { prefix } = parseCidr(cidr);
  const [base] = cidr.split('/');
  return PRIVATE_RANGES.some((range) => prefix >= parseCidr(range).prefix && ipInCidr(base, range));
}

/** True when the IPv4 address is in the loopback range 127.0.0.0/8 (RFC 1122, §3.2.1.3), which belongs to the device itself and never goes out to a network. */
export function isLoopbackIpv4(ip: string): boolean {
  return ipInCidr(ip, LOOPBACK_RANGE);
}
