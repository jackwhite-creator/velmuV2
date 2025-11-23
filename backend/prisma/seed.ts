import { PrismaClient, ChannelType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // 1. NETTOYAGE (Attention, ça vide la DB !)
  // Commente ces lignes si tu veux ajouter des données sans supprimer l'existant
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.category.deleteMany();
  await prisma.member.deleteMany();
  await prisma.role.deleteMany();
  await prisma.server.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Base de données nettoyée.');

  // 2. CRÉATION UTILISATEURS
  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'test@velmu.com',
      username: 'Tester',
      discriminator: '0001',
      passwordHash,
      bio: "Je suis là pour tester le scroll.",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bot@velmu.com',
      username: 'SpammerBot',
      discriminator: '9999',
      passwordHash,
      bio: "Je parle beaucoup.",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Spam"
    }
  });

  console.log('👥 Utilisateurs créés.');

  // 3. CRÉATION SERVEUR & CHANNEL
  const server = await prisma.server.create({
    data: {
      name: "Zone de Test 51",
      ownerId: user1.id,
      iconUrl: "https://placehold.co/400x400/5865F2/white?text=TEST"
    }
  });

  // Rôle Admin
  const role = await prisma.role.create({
    data: {
        name: "Admin",
        color: "#E91E63",
        permissions: ["ADMINISTRATOR"],
        serverId: server.id,
        position: 999
    }
  });

  // Membres
  await prisma.member.create({ data: { userId: user1.id, serverId: server.id, roleIds: [role.id] } });
  await prisma.member.create({ data: { userId: user2.id, serverId: server.id } });

  // Catégorie
  const category = await prisma.category.create({
    data: { name: "Salons Textuels", serverId: server.id, order: 0 }
  });

  // Channel
  const channel = await prisma.channel.create({
    data: {
      name: "général-spam",
      type: ChannelType.TEXT, // Utilisation de l'Enum
      serverId: server.id,
      categoryId: category.id
    }
  });

  console.log('🌐 Serveur et Channel créés.');

  // 4. GÉNÉRATION DES MESSAGES (Stress Test)
  console.log('💬 Génération de 1000 messages... (Patience)');

  const messagesData = [];
  
  // Phrases aléatoires pour varier le contenu
  const sentences = [
    "Salut, ça va ?",
    "Oui et toi ?",
    "On teste le scroll infini là.",
    "Est-ce que le chargement est fluide ?",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Ceci est un message très long pour vérifier si le retour à la ligne fonctionne correctement dans l'interface de chat, car c'est important d'avoir un beau rendu CSS.",
    "Ok.",
    "Haha",
    "J'aime bien les chats.",
    "Attention bug !",
    "Il fait beau aujourd'hui.",
    "Test 123.",
    "Encore un message.",
    "Spam spam spam."
  ];

  // On commence il y a 30 jours
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 10);

  for (let i = 0; i < 300; i++) {
    // Choix user aléatoire (70% user1, 30% user2)
    const senderId = Math.random() > 0.3 ? user1.id : user2.id;
    
    // Contenu aléatoire
    const content = sentences[Math.floor(Math.random() * sentences.length)];

    // Avancement du temps
    // Parfois on avance juste de quelques secondes (groupement), parfois de quelques heures (séparateur date)
    const timeJump = Math.random() > 0.8 ? 1000 * 60 * 60 * 4 : 1000 * 30; // 4h ou 30s
    currentDate = new Date(currentDate.getTime() + timeJump);

    messagesData.push({
      content: `#${i + 1} - ${content}`, // On numérote pour vérifier l'ordre facilement
      userId: senderId,
      channelId: channel.id,
      createdAt: new Date(currentDate), // Important: Date clonée
      updatedAt: new Date(currentDate)
    });
  }

  // Insertion en masse (Beaucoup plus rapide que boucle for await)
  await prisma.message.createMany({
    data: messagesData
  });

  console.log(`✅ ${messagesData.length} messages insérés avec succès !`);
  console.log(`🔑 Login User 1 : test@velmu.com / password123`);
  console.log(`🔑 Login User 2 : bot@velmu.com / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });