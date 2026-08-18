import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10)

    await prisma.admin.upsert({
      where: { email: 'admin@petrolpump.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'admin@petrolpump.com',
        password: passwordHash,
      },
    })

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

    return NextResponse.json({ success: true, message: 'Database seeded' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 })
  }
}
