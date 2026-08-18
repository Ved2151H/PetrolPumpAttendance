import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    
    if (!dateStr) {
      return NextResponse.json({ success: false, error: { message: 'Date parameter is required' } }, { status: 400 })
    }

    const date = new Date(dateStr)
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setHours(23, 59, 59, 999))

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        worker: true
      }
    })

    return NextResponse.json({ success: true, data: attendances })
  } catch (error) {
    console.error('Failed to fetch attendance:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch attendance' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { date, records } = data // records: { workerId: string, status: 'PRESENT' | 'ABSENT' }[]

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: { message: 'Invalid payload' } }, { status: 400 })
    }

    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0) // Normalize to midnight

    // Use transaction to ensure data integrity
    const savedRecords = await prisma.$transaction(
      records.map(record => 
        prisma.attendance.upsert({
          where: {
            workerId_date: {
              workerId: record.workerId,
              date: targetDate
            }
          },
          update: {
            status: record.status
          },
          create: {
            workerId: record.workerId,
            date: targetDate,
            status: record.status
          }
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        action: 'ATTENDANCE_MARKED',
        details: `Attendance marked for ${records.length} workers on ${targetDate.toISOString().split('T')[0]}`
      }
    })

    return NextResponse.json({ success: true, data: savedRecords })
  } catch (error) {
    console.error('Failed to save attendance:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to save attendance' } }, { status: 500 })
  }
}
