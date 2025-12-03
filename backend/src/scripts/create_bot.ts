import { PrismaClient } from '@prisma/client';
import { botService } from '../services/bot.service';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  // 1. Find an owner (first user)
  const owner = await prisma.user.findFirst({
      where: { isBot: false }
  });

  if (!owner) {
    console.error("Aucun utilisateur trouvé pour être propriétaire du bot.");
    return;
  }

  console.log(`Création d'un bot pour ${owner.username}...`);

  // 2. Create Bot
  const botName = `VelmuBot_${Math.floor(Math.random() * 1000)}`;
  const result = await botService.createBot(owner.id, botName);

  console.log("\n--- BOT CRÉÉ AVEC SUCCÈS ---");
  console.log(`Nom: ${result.bot.username}`);
  console.log(`ID: ${result.bot.id}`);
  console.log(`Token: ${result.token}`);
  fs.writeFileSync('bot_token.txt', result.token);
  console.log("Token sauvegardé dans bot_token.txt");
  console.log("----------------------------\n");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
