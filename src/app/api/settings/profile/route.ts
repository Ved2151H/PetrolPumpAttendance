import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { name, email, companyAddress, companyEmail } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ success: false, error: { message: 'Name and email are required' } }, { status: 400 })
    }

    // Check if email is being changed and is already taken
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    })
    
    if (existingAdmin && existingAdmin.id !== session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Email is already in use by another account' } }, { status: 400 })
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: session.adminId },
      data: { name, email },
      select: { id: true, name: true, email: true }
    })

    const { getFirmId } = await import('@/lib/firm');
    const firmId = await getFirmId();
    if (firmId) {
      await prisma.firm.update({
        where: { id: firmId },
        data: { companyAddress, companyEmail }
      })
    }

    await createAuditLog(session.adminId, 'UPDATE_PROFILE', 'Updated profile information and company details', 'Admin', session.adminId)

    return NextResponse.json({ success: true, data: updatedAdmin })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
