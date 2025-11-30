import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
  {
    name: 'Staff',
    description: 'Membre de l\'équipe Velmu',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/924/924953.png' // Placeholder Shield
  },
  {
    name: 'Developer',
    description: 'Développeur de Velmu',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1005/1005141.png' // Placeholder Code
  },
  {
    name: 'Bug Hunter',
    description: 'Chasseur de bugs émérite',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1231/1231418.png' // Placeholder Bug
  },
  {
    name: 'Early Supporter',
    description: 'Supporter de la première heure',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616490.png' // Placeholder Star
  }
];

async function main() {
  console.log('Seeding badges...');

  for (const badge of badges) {
    const existing = await prisma.badge.findUnique({ where: { name: badge.name } });
    if (!existing) {
      await prisma.badge.create({ data: badge });
      console.log(`Created badge: ${badge.name}`);
    } else {
      console.log(`Badge already exists: ${badge.name}`);
    }
  }

  console.log('Badges seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
