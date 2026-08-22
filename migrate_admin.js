const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  if (admins.length > 0) {
    const firstAdmin = admins[0];
    await prisma.admin.update({
      where: { id: firstAdmin.id },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log(Updated admin \ to SUPER_ADMIN.);
  } else {
    console.log("No admins found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
