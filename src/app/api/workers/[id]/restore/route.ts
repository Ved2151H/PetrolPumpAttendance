import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params

    const restoredWorker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        deletedAt: null
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'WORKER_RESTORED',
        details: `Worker ${restoredWorker.name} restored from trash.`
      }
    })

    return NextResponse.json({ success: true, data: restoredWorker })
  } catch (error) {
    console.error('Failed to restore worker:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to restore worker' } }, { status: 500 })
  }
}
