import { Request, Response } from 'express';
import { botService } from '../services/bot.service';

export const createBot = async (req: Request, res: Response) => {
  try {
    const { name, avatarUrl } = req.body;
    // @ts-ignore
    const ownerId = req.user.userId;

    if (!name) return res.status(400).json({ error: "Le nom est requis" });

    const result = await botService.createBot(ownerId, name, avatarUrl);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyBots = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const ownerId = req.user.userId;
    const bots = await botService.getMyBots(ownerId);
    res.json(bots);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const regenerateToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const ownerId = req.user.userId;
    const result = await botService.regenerateToken(ownerId, id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const addToServer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // botId
    const { serverId, permissions } = req.body;
    // @ts-ignore
    const ownerId = req.user.userId;

    if (!serverId) return res.status(400).json({ error: "Server ID requis" });

    await botService.addBotToServer(ownerId, id, serverId, permissions);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateBot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, bio } = req.body;
    // @ts-ignore
    const ownerId = req.user.userId;

    const result = await botService.updateBot(ownerId, id, { name, avatarUrl, bio });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const ownerId = req.user.userId;

    await botService.deleteBot(ownerId, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getBotPreview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await botService.getBotPreview(id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
