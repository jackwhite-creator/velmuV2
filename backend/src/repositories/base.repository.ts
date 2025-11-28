/**
 * Base Repository
 * Classe abstraite avec méthodes CRUD communes
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

export abstract class BaseRepository<T = any> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Trouve une entité par ID
   */
  async findById(id: string, include?: any): Promise<T | null> {
    const model = (this.prisma as any)[this.modelName];
    return model.findUnique({
      where: { id },
      ...(include && { include })
    });
  }

  /**
   * Trouve toutes les entités
   */
  async findMany(where?: any, options?: any): Promise<T[]> {
    const model = (this.prisma as any)[this.modelName];
    return model.findMany({
      ...(where && { where }),
      ...options
    });
  }

  /**
   * Compte les entités
   */
  async count(where?: any): Promise<number> {
    const model = (this.prisma as any)[this.modelName];
    return model.count({ where });
  }

  /**
   * Crée une entité
   */
  async create(data: any, include?: any): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.create({
      data,
      ...(include && { include })
    });
  }

  /**
   * Met à jour une entité
   */
  async update(id: string, data: any, include?: any): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.update({
      where: { id },
      data,
      ...(include && { include })
    });
  }

  /**
   * Supprime une entité
   */
  async delete(id: string): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.delete({
      where: { id }
    });
  }

  /**
   * Vérifie si une entité existe
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }
}
