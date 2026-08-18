import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true, name: true, email: true }
    })

    if (!admin) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: admin })
  } catch (error) {
    console.error('Failed to fetch current user:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
