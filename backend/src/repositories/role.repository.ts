import { Role } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super('role');
  }
  /**
   * Crée un nouveau rôle
   */
  async createRole(data: {
    serverId: string;
    name: string;
    color: string;
    permissions: string[];
    position: number;
    isManaged?: boolean;
  }): Promise<Role> {
    return this.prisma.role.create({
      data
    });
  }
}

export const roleRepository = new RoleRepository();
