import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../jwt/authenticated-user';

export const ROLES_KEY = 'kumoko:roles';

/** Restringe a rota aos papeis informados, ex.: `@Roles('admin')`. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
