import { Bot } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class BotRepository extends BaseRepository<Bot> {
  constructor() {
    super('bot');
  }

  async findByOwnerId(ownerId: string): Promise<Bot[]> {
    // @ts-ignore - 'bot' model might not be in client yet
    return this.prisma.bot.findMany({
      where: { ownerId },
      include: {
        botUser: true
      }
    });
  }

  async createBot(data: {
    ownerId: string;
    botUserId: string;
    tokenSecret: string;
  }): Promise<Bot> {
    // @ts-ignore
    return this.create(data);
  }

  async findById(id: string): Promise<Bot | null> {
    // @ts-ignore
    return this.prisma.bot.findUnique({
      where: { id },
      include: {
        botUser: true
      }
    });
  }
}

export const botRepository = new BotRepository();
