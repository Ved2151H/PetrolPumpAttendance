import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        attendances: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!worker) {
      return NextResponse.json({ success: false, error: { message: 'Worker not found' } }, { status: 404 })
    }

    const presentDays = worker.attendances.filter((a: any) => a.status === 'PRESENT').length
    const absentDays = worker.attendances.filter((a: any) => a.status === 'ABSENT').length
    const totalRecordedDays = presentDays + absentDays
    const attendancePercentage = totalRecordedDays > 0 
      ? Math.round((presentDays / totalRecordedDays) * 100) 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        ...worker,
        stats: {
          totalRecordedDays,
          presentDays,
          absentDays,
          attendancePercentage
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch worker:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch worker details' } }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params
    const data = await request.json()

    // Validate phone if provided
    if (data.phone && data.phone.trim().length < 8) {
      return NextResponse.json({ success: false, error: { message: 'Invalid phone number' } }, { status: 400 })
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'WORKER_UPDATED',
        details: `Worker ${updatedWorker.name} details updated.`
      }
    })

    return NextResponse.json({ success: true, data: updatedWorker })
  } catch (error) {
    console.error('Failed to update worker:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to update worker' } }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params

    const deletedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        deletedAt: new Date()
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'WORKER_REMOVED',
        details: `Worker ${deletedWorker.name} softly removed.`
      }
    })

    return NextResponse.json({ success: true, data: { deletedAt: deletedWorker.deletedAt } })
  } catch (error) {
    console.error('Failed to remove worker:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to remove worker' } }, { status: 500 })
  }
}
