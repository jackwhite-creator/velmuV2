import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// On définit un ID fixe et un nom pour notre bot.
const AI_BOT_ID = 'cl-velmu-ai-bot-0001';
const AI_BOT_NAME = 'Velmu AI';

async function main() {
  console.log('Seeding database...');

  const existingBot = await prisma.user.findUnique({
    where: { id: AI_BOT_ID },
  });

  if (!existingBot) {
    console.log(`Creating bot user: ${AI_BOT_NAME}`);
    const passwordHash = await bcrypt.hash('!@#$StrongPasswordForBotDoNotUse$#@!', SALT_ROUNDS);

    await prisma.user.create({
      data: {
        id: AI_BOT_ID,
        email: 'bot@velmu.app', // Email factice
        username: AI_BOT_NAME,
        discriminator: '0000',
        passwordHash: passwordHash,
        avatarUrl: 'https://i.imgur.com/8z2d72a.png', // Un avatar de robot sympa
        bio: 'Je suis l\'intelligence artificielle de Velmu. Mentionne-moi pour me poser une question !',
      },
    });
  } else {
    console.log(`${AI_BOT_NAME} user already exists.`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });