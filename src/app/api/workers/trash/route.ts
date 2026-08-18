import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const trashedWorkers = await prisma.worker.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: trashedWorkers })
  } catch (error) {
    console.error('Failed to fetch trashed workers:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch trashed workers' } }, { status: 500 })
  }
}
