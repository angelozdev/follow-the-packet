import { ipInCidr } from '../cidr';
import { CONTINUE, stop, type Stage } from './context';

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (ipInCidr(destIp, net.vpcCidr)) {
    if (!source.inside) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: `${destIp} es una IP privada: solo existe dentro de la VPC. Desde internet no hay camino.` });
      return stop('timeout');
    }
    const dest = net.instances.find((i) => i.privateIp === destIp);
    if (!dest) {
      ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'drop', reason: `Ninguna instancia tiene la IP ${destIp}.` });
      return stop('timeout');
    }
    ctx.dest = dest;
    ctx.path = 'private';
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'pass', reason: 'Viaja por dentro de la VPC, con IPs privadas.' });
    return CONTINUE;
  }

  const dest = net.instances.find((i) => i.publicIp === destIp);
  if (!dest) {
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: `Ninguna instancia de la VPC tiene la IP pública ${destIp}.` });
    return stop('timeout');
  }
  if (source.instance) {
    const publicIp = source.instance.publicIp;
    if (!publicIp) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: `${source.instance.name} no tiene IP pública: no puede salir a internet.` });
      return stop('timeout');
    }
    ctx.effectiveSource = publicIp;
    ctx.steps.push({ stage: 'nat', at: 'igw', verdict: 'info', reason: `Sale por el internet gateway: el origen cambia de ${source.ip} a ${publicIp}.` });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'pass', reason: 'Entra desde internet por el internet gateway.' });
  }
  ctx.dest = dest;
  ctx.path = 'public';
  return CONTINUE;
};
