require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
import prisma from './src/lib/prisma';

async function main() {
  console.log('Creating firms...');
  
  await prisma.firm.upsert({
    where: { id: 'narmata' },
    update: { name: 'Narmata Construction Private Limited' },
    create: { id: 'narmata', name: 'Narmata Construction Private Limited' }
  });

  await prisma.firm.upsert({
    where: { id: 'patil' },
    update: { name: 'Patil Petroleum Private Limited' },
    create: { id: 'patil', name: 'Patil Petroleum Private Limited' }
  });

  console.log('Updating existing records to use narmata...');

  const workers = await prisma.worker.updateMany({
    where: { firmId: null as any },
    data: { firmId: 'narmata' }
  });
  console.log(`Updated ${workers.count} workers`);

  const notes = await prisma.note.updateMany({
    where: { firmId: null as any },
    data: { firmId: 'narmata' }
  });
  console.log(`Updated ${notes.count} notes`);

  const auditLogs = await prisma.auditLog.updateMany({
    where: { firmId: null as any },
    data: { firmId: 'narmata' }
  });
  console.log(`Updated ${auditLogs.count} audit logs`);

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
