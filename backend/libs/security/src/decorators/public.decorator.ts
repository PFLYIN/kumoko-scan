import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'kumoko:isPublic';

/** Marca a rota (ou o controller) como publica: o JwtAuthGuard global nao exige token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
