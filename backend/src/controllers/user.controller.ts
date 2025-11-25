import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { bio } = req.body;
    
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const updates: any = { bio };

    // Gestion des fichiers (Avatar & Bannière)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files?.avatar?.[0]) {
      updates.avatarUrl = files.avatar[0].path; // URL Cloudinary
    }

    if (files?.banner?.[0]) {
      updates.bannerUrl = files.banner[0].path; // URL Cloudinary
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

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
        bannerUrl: true,
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