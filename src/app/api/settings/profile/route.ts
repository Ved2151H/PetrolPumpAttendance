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

    const { name, email, companyAddress, companyEmail, supportContact } = await request.json()

    // 1. Handle Admin Profile Update if name or email is provided
    let updatedAdmin = null;
    if (name !== undefined || email !== undefined) {
      if (name === "" || email === "") {
        return NextResponse.json({ success: false, error: { message: 'Name and email cannot be empty' } }, { status: 400 })
      }

      const adminUpdateData: any = {};
      if (name !== undefined) adminUpdateData.name = name;
      if (email !== undefined) {
        adminUpdateData.email = email;
        // Check if email is being changed and is already taken
        const existingAdmin = await prisma.admin.findUnique({
          where: { email }
        })
        if (existingAdmin && existingAdmin.id !== session.adminId) {
          return NextResponse.json({ success: false, error: { message: 'Email is already in use by another account' } }, { status: 400 })
        }
      }

      updatedAdmin = await prisma.admin.update({
        where: { id: session.adminId },
        data: adminUpdateData,
        select: { id: true, name: true, email: true }
      })
    }

    // 2. Handle Firm Details Update if any company fields are provided
    const firmUpdateData: any = {};
    if (companyAddress !== undefined) firmUpdateData.companyAddress = companyAddress;
    if (companyEmail !== undefined) firmUpdateData.companyEmail = companyEmail;
    if (supportContact !== undefined) firmUpdateData.supportContact = supportContact;

    if (Object.keys(firmUpdateData).length > 0) {
      const { getFirmId } = await import('@/lib/firm');
      const firmId = await getFirmId();
      if (firmId) {
        await prisma.firm.update({
          where: { id: firmId },
          data: firmUpdateData
        })
      }
    }

    await createAuditLog(session.adminId, 'UPDATE_PROFILE', 'Updated profile/company settings', 'Admin', session.adminId)

    return NextResponse.json({ success: true, data: updatedAdmin })
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ success: false, error: { message: error?.message || 'Internal server error' } }, { status: 500 })
  }
}
