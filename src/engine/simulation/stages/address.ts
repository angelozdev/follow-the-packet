import { LOOPBACK_IP, isIpv4 } from '@/engine/network/addressing/cidr';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

const LOCALHOST = 'localhost';
const FOUR_NUMBERS = /^\d+(\.\d+){3}$/;

/** Checks what the player typed before anything is sent: a valid IPv4 literal becomes the destination, `localhost` becomes the loopback address without any lookup, and four numbers that are not an IPv4 address end the packet at the device. Anything else is a name for the next stage, and a stage that has nothing to say writes no step. */
export const addressStage: Stage = (ctx) => {
  const { packet, source } = ctx;
  if (packet.to === LOCALHOST) {
    ctx.destIp = LOOPBACK_IP;
    ctx.steps.push({ stage: 'address', at: source.id, verdict: 'info', reason: { code: 'address-localhost', ip: LOOPBACK_IP } });
    return CONTINUE;
  }
  if (isIpv4(packet.to)) {
    ctx.destIp = packet.to;
    return CONTINUE;
  }
  if (FOUR_NUMBERS.test(packet.to)) {
    ctx.steps.push({ stage: 'address', at: source.id, verdict: 'drop', reason: { code: 'address-invalid', address: packet.to } });
    return stop('invalid-address');
  }
  return CONTINUE;
};
