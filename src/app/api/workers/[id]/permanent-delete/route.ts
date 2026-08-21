import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params

    const archivedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        isArchived: true
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'WORKER_PERMANENTLY_DELETED',
        details: `Worker ${archivedWorker.name} permanently deleted from trash.`
      }
    })

    return NextResponse.json({ success: true, data: { isArchived: archivedWorker.isArchived } })
  } catch (error) {
    console.error('Failed to permanently delete worker:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to permanently delete worker' } }, { status: 500 })
  }
}
