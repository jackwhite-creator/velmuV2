import { PrismaClient, ChannelType, RequestStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const AI_BOT_ID = 'cl-velmu-ai-bot-0001';
const AI_BOT_NAME = 'Velmu AI';

const DEMO_USER_ID = 'cl-velmu-demo-user-0001';
const DEMO_USER_EMAIL = 'demo@velmu.app';
const DEMO_USER_NAME = 'Demo User';

const badges = [
  {
    name: 'Staff',
    description: 'Membre de l\'équipe Velmu',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/924/924953.png'
  },
  {
    name: 'Developer',
    description: 'Développeur de Velmu',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1005/1005141.png'
  },
  {
    name: 'Bug Hunter',
    description: 'Chasseur de bugs émérite',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1231/1231418.png'
  },
  {
    name: 'Early Supporter',
    description: 'Supporter de la première heure',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616490.png'
  }
];

const friendsData = [
    { username: 'Sarah_Connor', discriminator: '1984', avatar: 'https://i.pravatar.cc/300?img=5', bio: 'No fate but what we make.' },
    { username: 'JohnDoe', discriminator: '9999', avatar: 'https://i.pravatar.cc/300?img=11', bio: 'Just a regular guy.' },
    { username: 'GamerPro', discriminator: '1337', avatar: 'https://i.pravatar.cc/300?img=8', bio: 'FPS & RPG lover.' },
    { username: 'ArtistAnna', discriminator: '2023', avatar: 'https://i.pravatar.cc/300?img=9', bio: 'Digital Artist 🎨' },
    { username: 'CodeMaster', discriminator: '0101', avatar: 'https://i.pravatar.cc/300?img=3', bio: 'TypeScript is life.' }
];

async function main() {
  console.log('Seeding database...');

  // 1. Seed Badges
  console.log('Seeding badges...');
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log('Badges seeded.');

  // 2. Seed Bot User
  console.log(`Seeding bot user: ${AI_BOT_NAME}`);
  const botPasswordHash = await bcrypt.hash('!@#$StrongPasswordForBotDoNotUse$#@!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { id: AI_BOT_ID },
    update: {},
    create: {
      id: AI_BOT_ID,
      email: 'bot@velmu.app',
      username: AI_BOT_NAME,
      discriminator: '0000',
      passwordHash: botPasswordHash,
      avatarUrl: 'https://i.imgur.com/8z2d72a.png',
      bio: 'Je suis l\'intelligence artificielle de Velmu. Mentionne-moi pour me poser une question !',
    },
  });

  // 3. Seed Demo User
  console.log(`Seeding demo user: ${DEMO_USER_NAME}`);
  const demoPasswordHash = await bcrypt.hash('password123', SALT_ROUNDS);
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      username: DEMO_USER_NAME,
      discriminator: '1234',
      passwordHash: demoPasswordHash,
      avatarUrl: 'https://i.pravatar.cc/300?img=12',
      bio: 'Compte de démonstration pour tester les fonctionnalités.',
    },
  });

  // 4. Assign Badges to Demo User
  const staffBadge = await prisma.badge.findUnique({ where: { name: 'Staff' } });
  if (staffBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: demoUser.id, badgeId: staffBadge.id } },
      update: {},
      create: { userId: demoUser.id, badgeId: staffBadge.id },
    });
  }

  // 5. Create Friends
  console.log('Creating friends...');
  const friendUsers = [];
  for (const friend of friendsData) {
      const password = await bcrypt.hash('password123', SALT_ROUNDS);
      const user = await prisma.user.upsert({
          where: { email: `${friend.username.toLowerCase()}@example.com` },
          update: {},
          create: {
              email: `${friend.username.toLowerCase()}@example.com`,
              username: friend.username,
              discriminator: friend.discriminator,
              passwordHash: password,
              avatarUrl: friend.avatar,
              bio: friend.bio
          }
      });
      friendUsers.push(user);

      // Create Friendship (Accepted)
      await prisma.friendRequest.upsert({
          where: { senderId_receiverId: { senderId: demoUser.id, receiverId: user.id } },
          update: { status: RequestStatus.ACCEPTED },
          create: {
              senderId: demoUser.id,
              receiverId: user.id,
              status: RequestStatus.ACCEPTED
          }
      });
  }

  // 6. Create Server
  console.log('Creating demo server...');
  const server = await prisma.server.create({
      data: {
          name: 'Velmu Community',
          ownerId: demoUser.id,
          iconUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=200&auto=format&fit=crop',
          members: {
              create: [
                  { userId: demoUser.id, roleIds: [] }, // Owner is member
                  ...friendUsers.map(u => ({ userId: u.id, roleIds: [] })) // Add friends as members too
              ]
          }
      }
  });

  // 7. Create Categories and Channels
  console.log('Creating channels...');
  
  // Category: Information
  const catInfo = await prisma.category.create({
      data: { name: 'Information', serverId: server.id, order: 0 }
  });
  await prisma.channel.create({
      data: { name: 'règlement', type: ChannelType.TEXT, serverId: server.id, categoryId: catInfo.id, order: 0 }
  });
  const annoncesChannel = await prisma.channel.create({
      data: { name: 'annonces', type: ChannelType.TEXT, serverId: server.id, categoryId: catInfo.id, order: 1 }
  });

  // Category: Général
  const catGeneral = await prisma.category.create({
      data: { name: 'Général', serverId: server.id, order: 1 }
  });
  const generalChannel = await prisma.channel.create({
      data: { name: 'général', type: ChannelType.TEXT, serverId: server.id, categoryId: catGeneral.id, order: 0 }
  });
  await prisma.channel.create({
      data: { name: 'memes', type: ChannelType.TEXT, serverId: server.id, categoryId: catGeneral.id, order: 1 }
  });

  // Category: Vocal
  const catVoice = await prisma.category.create({
      data: { name: 'Salons Vocaux', serverId: server.id, order: 2 }
  });
  await prisma.channel.create({
      data: { name: 'Vocal 1', type: ChannelType.AUDIO, serverId: server.id, categoryId: catVoice.id, order: 0 }
  });

  // 8. Create Messages
  console.log('Creating messages...');
  
  await prisma.message.create({
      data: {
          content: 'Bienvenue sur le serveur officiel de la communauté !',
          userId: demoUser.id,
          channelId: annoncesChannel.id,
          type: 'DEFAULT'
      }
  });

  await prisma.message.create({
      data: {
          content: 'Salut tout le monde ! Comment ça va ?',
          userId: demoUser.id,
          channelId: generalChannel.id,
          type: 'DEFAULT'
      }
  });

  // Friends replying
  if (friendUsers.length > 0) {
      await prisma.message.create({
          data: {
              content: 'Yo ! Super ce nouveau serveur !',
              userId: friendUsers[0].id,
              channelId: generalChannel.id,
              type: 'DEFAULT'
          }
      });
  }

  if (friendUsers.length > 2) {
      await prisma.message.create({
          data: {
              content: 'Grave, l\'interface est incroyable.',
              userId: friendUsers[2].id,
              channelId: generalChannel.id,
              type: 'DEFAULT'
          }
      });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });