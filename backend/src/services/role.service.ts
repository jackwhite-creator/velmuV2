import { prisma } from '../lib/prisma';
import { AppError, NotFoundError } from '../middlewares/error.middleware';
import { Permissions, DEFAULT_PERMISSIONS } from '../shared/permissions';

export class RoleService {
  async getServerRoles(serverId: string) {
    return prisma.role.findMany({
      where: { serverId },
      orderBy: { position: 'desc' }
    });
  }

  async createRole(serverId: string) {
    const roleCount = await prisma.role.count({ where: { serverId } });

    return prisma.role.create({
      data: {
        name: 'nouveau rôle',
        color: '#99aab5',
        permissions: DEFAULT_PERMISSIONS,
        position: roleCount + 1,
        serverId
      }
    });
  }

  async updateRole(serverId: string, roleId: string, data: { name?: string; color?: string; permissions?: string[]; position?: number }) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, serverId }
    });

    if (!role) throw new NotFoundError('Rôle introuvable');

    if (role.name === '@everyone' && data.name && data.name !== '@everyone') {
        throw new AppError(400, "Impossible de renommer le rôle @everyone");
    }

    return prisma.role.update({
      where: { id: roleId },
      data
    });
  }

  async deleteRole(serverId: string, roleId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, serverId }
    });

    if (!role) throw new NotFoundError('Rôle introuvable');
    if (role.name === '@everyone') throw new AppError(400, "Impossible de supprimer le rôle @everyone");

    await prisma.role.delete({ where: { id: roleId } });
  }

  async updateRolePositions(serverId: string, roles: { id: string; position: number }[]) {
    const updatePromises = roles.map(r =>
      prisma.role.updateMany({
        where: { id: r.id, serverId },
        data: { position: r.position }
      })
    );

    await prisma.$transaction(updatePromises);
    return this.getServerRoles(serverId);
  }

  async createEveryoneRole(serverId: string) {
    return prisma.role.create({
      data: {
        name: '@everyone',
        color: '#99aab5',
        permissions: DEFAULT_PERMISSIONS,
        position: 0,
        serverId
      }
    });
  }
}

export const roleService = new RoleService();
