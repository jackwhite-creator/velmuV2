import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/role.service';

export const getServerRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const roles = await roleService.getServerRoles(serverId);
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const role = await roleService.createRole(serverId);
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, roleId } = req.params;
    const { name, color, permissions, position } = req.body;
    const role = await roleService.updateRole(serverId, roleId, { name, color, permissions, position });
    res.json(role);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, roleId } = req.params;
    await roleService.deleteRole(serverId, roleId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateRolePositions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { roles } = req.body; 
    const updatedRoles = await roleService.updateRolePositions(serverId, roles);
    res.json(updatedRoles);
  } catch (error) {
    next(error);
  }
};
