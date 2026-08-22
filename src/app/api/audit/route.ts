import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const currentAdmin = await prisma.admin.findUnique({ where: { id: session.adminId } })
    if (currentAdmin?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })
    
    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
