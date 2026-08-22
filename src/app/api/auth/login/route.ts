import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare } from 'bcrypt'
import { setSession } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing email or password' } },
        { status: 400 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid credentials' } },
        { status: 401 }
      )
    }

    const passwordMatch = await compare(password, admin.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid credentials' } },
        { status: 401 }
      )
    }

    await setSession(admin.id)

    // Fire and forget audit log
    createAuditLog(admin.id, 'LOGIN', 'Admin logged in', 'Auth', admin.id).catch(console.error)

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
