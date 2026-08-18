import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { setSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: { message: 'Email and password are required' } }, { status: 400 })
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json({ success: false, error: { message: 'Invalid credentials' } }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: { message: 'Invalid credentials' } }, { status: 401 })
    }

    // Set JWT cookie session
    const token = await setSession(admin.id)

    return NextResponse.json({ 
      success: true, 
      data: { 
        user: { id: admin.id, name: admin.name, email: admin.email },
        token
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
