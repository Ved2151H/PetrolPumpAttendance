const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Creating firms...');
  
  await prisma.firm.upsert({
    where: { id: 'narmata' },
    update: {},
    create: { id: 'narmata', name: 'Narmata Construction' }
  });

  await prisma.firm.upsert({
    where: { id: 'patil' },
    update: {},
    create: { id: 'patil', name: 'Patil Petroleum' }
  });

  console.log('Updating existing records to use narmata...');

  const workers = await prisma.worker.updateMany({
    where: { firmId: null },
    data: { firmId: 'narmata' }
  });
  console.log(`Updated ${workers.count} workers`);

  const notes = await prisma.note.updateMany({
    where: { firmId: null },
    data: { firmId: 'narmata' }
  });
  console.log(`Updated ${notes.count} notes`);

  const auditLogs = await prisma.auditLog.updateMany({
    where: { firmId: null },
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
