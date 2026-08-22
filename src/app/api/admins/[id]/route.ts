import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const currentAdmin = await prisma.admin.findUnique({ where: { id: session.adminId } })
    if (currentAdmin?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 })
    }

    const adminToDeleteId = params.id
    if (session.adminId === adminToDeleteId) {
      return NextResponse.json({ success: false, error: { message: 'Admin 1 cannot delete their own account.' } }, { status: 403 })
    }

    const adminToDelete = await prisma.admin.findUnique({ where: { id: adminToDeleteId } })
    if (!adminToDelete) {
      return NextResponse.json({ success: false, error: { message: 'Admin not found' } }, { status: 404 })
    }

    await prisma.admin.delete({ where: { id: adminToDeleteId } })

    await createAuditLog(
      session.adminId,
      'DELETE_ADMIN',
      `Deleted admin ${adminToDelete.adminNumber} (${adminToDelete.name})`,
      'Admin',
      adminToDeleteId
    )

    return NextResponse.json({ success: true, data: {} })
  } catch (error) {
    console.error('Failed to delete admin:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
