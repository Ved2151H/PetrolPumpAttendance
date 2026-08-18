import prisma from '../src/lib/prisma'
import bcrypt from 'bcrypt'

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  // Seed Admin
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@petrolpump.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@petrolpump.com',
      password: passwordHash,
    },
  })

  console.log(`Admin created: ${admin.email} / admin123`)

  // Seed Workers
  const workersData = [
    { name: 'Rahul Sharma', phone: '9876543210' },
    { name: 'Amit Patil', phone: '9876543211' },
    { name: 'Suresh More', phone: '9876543212' },
    { name: 'Akash Kumar', phone: '9876543213' },
  ]

  for (const w of workersData) {
    await prisma.worker.create({
      data: {
        name: w.name,
        phone: w.phone,
      }
    })
  }

  console.log('Workers seeded successfully.')
}

main()
  .then(async () => {
    // Adapter doesn't need strict disconnect but it's good practice if needed
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  })
