import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hash } from 'bcrypt'
import { createAuditLog } from '@/lib/audit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const currentAdmin = await prisma.admin.findUnique({ where: { id: session.adminId } })
    if (currentAdmin?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 })
    }

    const admins = await prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, adminNumber: true, createdAt: true },
      orderBy: { adminNumber: 'asc' }
    })
    
    return NextResponse.json({ success: true, data: admins })
  } catch (error) {
    console.error('Failed to fetch admins:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const currentAdmin = await prisma.admin.findUnique({ where: { id: session.adminId } })
    if (currentAdmin?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: { message: 'Missing fields' } }, { status: 400 })
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } })
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: { message: 'Email already exists' } }, { status: 400 })
    }

    const passwordHash = await hash(password, 10)

    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: 'ADMIN'
      }
    })

    await createAuditLog(
      session.adminId,
      'CREATE_ADMIN',
      `Created admin ${newAdmin.adminNumber} (${newAdmin.name})`,
      'Admin',
      newAdmin.id
    )

    return NextResponse.json({ success: true, data: { id: newAdmin.id } }, { status: 201 })
  } catch (error) {
    console.error('Failed to create admin:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
