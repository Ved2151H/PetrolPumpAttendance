import { NextResponse } from 'next/server'
import { getSession, clearSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: { message: 'Current and new passwords are required' } }, { status: 400 })
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: { message: 'New password must be at least 6 characters long' } }, { status: 400 })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId }
    })

    if (!admin) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: { message: 'Incorrect current password' } }, { status: 401 })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.admin.update({
      where: { id: session.adminId },
      data: { password: hashedNewPassword }
    })

    // Invalidate the session after a successful password change
    await clearSession()

    return NextResponse.json({ success: true, data: { message: 'Password changed successfully' } })
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
