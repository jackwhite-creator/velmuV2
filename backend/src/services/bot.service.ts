import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository, badgeRepository, memberRepository, roleRepository } from '../repositories';
import { botRepository } from '../repositories/bot.repository';
import { config } from '../config/env';

export class BotService {
  
  async createBot(ownerId: string, name: string, avatarUrl?: string) {
    // 1. Create Bot User
    const discriminator = await userRepository.generateDiscriminator(name);
    const email = `bot_${uuidv4()}@velmu.bot`;
    const password = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    // @ts-ignore - isBot not yet in types
    const botUser = await userRepository.createUser({
      email,
      username: name,
      discriminator,
      passwordHash,
      isBot: true,
      avatarUrl
    });

    // 1.5 Assign BOT Badge
    const botBadge = await badgeRepository.findByName('BOT');
    if (botBadge) {
        await badgeRepository.assignToUser(botUser.id, botBadge.id);
    }

    // 2. Create Bot Entry
    const tokenSecret = crypto.randomBytes(32).toString('hex');
    const bot = await botRepository.createBot({
      ownerId,
      botUserId: botUser.id,
      tokenSecret
    });

    // 3. Generate Token
    const token = this.generateBotToken(botUser.id, bot.id);

    return {
      bot: {
        id: bot.id,
        username: botUser.username,
        discriminator: botUser.discriminator,
        avatarUrl: botUser.avatarUrl,
        createdAt: bot.createdAt
      },
      token
    };
  }

  async getMyBots(ownerId: string) {
    const bots = await botRepository.findByOwnerId(ownerId);
    return bots.map((b: any) => ({
      id: b.id,
      username: b.botUser.username,
      discriminator: b.botUser.discriminator,
      avatarUrl: b.botUser.avatarUrl,
      createdAt: b.createdAt,
      bio: b.botUser.bio
    }));
  }

  async regenerateToken(ownerId: string, botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new Error("Bot introuvable");
    if (bot.ownerId !== ownerId) throw new Error("Non autorisé");

    const token = this.generateBotToken(bot.botUserId, bot.id);
    return { token };
  }

  async updateBot(ownerId: string, botId: string, data: { name?: string, avatarUrl?: string, bio?: string, bannerUrl?: string }) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new Error("Bot introuvable");
    if (bot.ownerId !== ownerId) throw new Error("Non autorisé");

    // Update the underlying User
    const updatedUser = await userRepository.updateUser(bot.botUserId, {
        username: data.name,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        bannerUrl: data.bannerUrl
    });

    return {
        id: bot.id,
        username: updatedUser.username,
        discriminator: updatedUser.discriminator,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        bannerUrl: updatedUser.bannerUrl,
        createdAt: bot.createdAt
    };
  }

  async deleteBot(ownerId: string, botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new Error("Bot introuvable");
    if (bot.ownerId !== ownerId) throw new Error("Non autorisé");

    // Delete the bot entry (cascade should handle user if configured, but let's be safe)
    // Actually, we should delete the User, and the Bot entry will be deleted via cascade if relation is set up that way.
    // In schema: Bot -> User (BotUser) onDelete: Cascade. So deleting User deletes Bot.
    
    await userRepository.deleteUser(bot.botUserId);
    return { success: true };
  }

  async getBotPreview(botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new Error("Bot introuvable");
    
    const botData = bot as any;
    return {
        id: bot.id,
        username: botData.botUser.username,
        avatarUrl: botData.botUser.avatarUrl,
        bio: botData.botUser.bio
    };
  }

  private generateBotToken(userId: string, botId: string): string {
    return jwt.sign(
      { 
        userId, 
        botId, 
        type: 'bot' 
      }, 
      config.jwtSecret
    ); 
  }

  async addBotToServer(ownerId: string, botId: string, serverId: string, permissions: string[] = []) {
    // 1. Verify Bot Ownership
    const bot = await botRepository.findById(botId);
    if (!bot) throw new Error("Bot introuvable");
    if (bot.ownerId !== ownerId) throw new Error("Non autorisé : Vous ne possédez pas ce bot");

    // 2. Verify User Permissions on Server (Must be Admin or have MANAGE_GUILD)
    const hasPermission = await memberRepository.hasPermission(ownerId, serverId, 'MANAGE_SERVER');
    
    if (!hasPermission) {
        throw new Error("Non autorisé : Vous devez avoir la permission Gérer le Serveur");
    }

    // 3. Check if bot is already in server
    const isMember = await memberRepository.isMember(bot.botUserId, serverId);
    if (isMember) throw new Error("Ce bot est déjà sur ce serveur");

    // 4. Create Role for Bot if permissions requested
    let roleIds: string[] = [];
    const botData = bot as any;
    if (permissions.length > 0) {
        const botRole = await roleRepository.createRole({
            serverId,
            name: botData.botUser.username, // Role name = Bot name
            color: '#99aab5',
            permissions: permissions,
            position: 1, // TODO: Handle position properly
            isManaged: true
        });
        roleIds.push(botRole.id);
    }

    // 5. Add Bot to Server with Role
    await memberRepository.addMember(bot.botUserId, serverId, roleIds);

    return { success: true };
  }
}

export const botService = new BotService();
