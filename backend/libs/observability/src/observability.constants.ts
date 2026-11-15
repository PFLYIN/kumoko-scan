export const OBSERVABILITY_OPTIONS = Symbol('OBSERVABILITY_OPTIONS');

export interface ObservabilityOptions {
  serviceName: string;
}

/** Rotas de infraestrutura: fora do prefixo /api, sem log de acesso e sem metrica HTTP. */
export const INFRA_PATHS = ['/health', '/metrics'];

export function isInfraPath(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  const path = url.split('?')[0];
  return INFRA_PATHS.some((infra) => path === infra || path.startsWith(`${infra}/`));
}
