const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
// Enum mapping manually since we are in JS
const Frequency = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  CUSTOM: 'CUSTOM'
};

async function main() {
  console.log('Cleaning up...');
  await prisma.transferRequest.deleteMany();
  await prisma.choreInstance.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.user.deleteMany();

  // Create 3 Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'User 1',
        color: '#3b82f6', // blue
        avatar: 'https://github.com/shadcn.png',
      }
    }),
    prisma.user.create({
      data: {
        name: 'User 2',
        color: '#a855f7', // purple
        avatar: 'https://github.com/shadcn.png',
      }
    }),
    prisma.user.create({
      data: {
        name: 'User 3',
        color: '#14b8a6', // teal
        avatar: 'https://github.com/shadcn.png',
      }
    }),
  ]);

  console.log('Created users:', users.map(u => u.name));

  // Define Chores
  const choresData = [
    { title: 'Dish washing', icon: 'Utensils', frequency: Frequency.DAILY, difficulty: 5 },
    { title: 'Cleaning the house', icon: 'Home', frequency: Frequency.WEEKLY, difficulty: 20 },
    { title: 'Taking out trash', icon: 'Trash', frequency: Frequency.WEEKLY, difficulty: 10 },
    { title: 'Cooking', icon: 'ChefHat', frequency: Frequency.DAILY, difficulty: 15 },
    { title: 'Going out for night watch', icon: 'Moon', frequency: Frequency.WEEKLY, difficulty: 30 },
    { title: 'Community cleaning', icon: 'Users', frequency: Frequency.MONTHLY, difficulty: 25 },
    { title: 'Refining water reserve', icon: 'Droplet', frequency: Frequency.WEEKLY, difficulty: 15 },
    { title: 'Carrying out jar for drinking water', icon: 'GlassWater', frequency: Frequency.DAILY, difficulty: 10 },
  ];

  const createdChores = [];
  // Create Chores
  for (const chore of choresData) {
    const c = await prisma.chore.create({
      data: chore
    });
    createdChores.push(c);
  }

  console.log('Created chores');

  // Create Instances (Assign randomly for today/tomorrow)
  const today = new Date();
  
  for (const chore of createdChores) {
      const assignee = users[Math.floor(Math.random() * users.length)];
      
      await prisma.choreInstance.create({
          data: {
              choreId: chore.id,
              assignedUserId: assignee.id,
              dueDate: today,
              status: 'PENDING'
          }
      });
  }

  console.log('Created initial chore instances');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
