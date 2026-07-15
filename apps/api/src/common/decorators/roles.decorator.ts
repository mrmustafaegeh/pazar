import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
  FINANCE = 'FINANCE',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
