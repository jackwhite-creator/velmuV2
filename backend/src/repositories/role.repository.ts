import { Role } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super('role');
  }
}

export const roleRepository = new RoleRepository();
