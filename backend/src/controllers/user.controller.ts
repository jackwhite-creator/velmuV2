import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

// Mettre à jour son propre profil
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { bio, avatarUrl, bannerUrl } = req.body; // On récupère bannerUrl

    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        avatarUrl,
        bannerUrl // On sauvegarde
      },
      select: {
        id: true,
        email: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        bannerUrl: true, // On renvoie la nouvelle bannière
        bio: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

// Récupérer le profil public d'un autre utilisateur
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        bannerUrl: true, // On renvoie la bannière
        bio: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};