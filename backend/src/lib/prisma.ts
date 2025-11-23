import { PrismaClient } from '@prisma/client';

// On ajoute prisma à l'objet global de Node (pour éviter les multiples instances en dev)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query'], // Optionnel : pour voir les requêtes SQL dans la console
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;