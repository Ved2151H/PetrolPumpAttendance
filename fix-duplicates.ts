import prisma from './src/lib/prisma';

async function main() {
  const allAttendances = await prisma.attendance.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const seen = new Set();
  const toDelete = [];

  for (const a of allAttendances) {
    const day = new Date(a.date).toISOString().split('T')[0];
    const key = a.workerId + '_' + day;
    if (seen.has(key)) {
      toDelete.push(a.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    await prisma.attendance.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log('Deleted', toDelete.length, 'duplicates');
  } else {
    console.log('No duplicates found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
