import { getFirmId } from '@/lib/firm';
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const firmId = await getFirmId();
  if (!firmId) return NextResponse.json({ success: false, error: { message: 'Unauthorized - No firm selected' } }, { status: 401 });

  try {
    const trashedWorkers = await prisma.worker.findMany({
      where: { firmId,  deletedAt: { not: null }, isArchived: false },
      orderBy: { deletedAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: trashedWorkers })
  } catch (error) {
    console.error('Failed to fetch trashed workers:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch trashed workers' } }, { status: 500 })
  }
}
