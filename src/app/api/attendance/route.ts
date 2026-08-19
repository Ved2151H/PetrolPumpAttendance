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

    const uniqueAttendances = Array.from(new Map(attendances.map(a => [a.workerId, a])).values());

    return NextResponse.json({ success: true, data: uniqueAttendances })
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
    const currentDate = new Date()
    
    // Check if date is more than 7 days old
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(currentDate.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    
    if (targetDate < sevenDaysAgo) {
      return NextResponse.json({ success: false, error: { message: 'Cannot edit attendance older than 7 days' } }, { status: 400 })
    }

    // Normalize to strict UTC midnight to prevent timezone duplicates
    const normalizedDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));

    // Validate times before transaction
    for (const record of records) {
      if (record.status === 'ABSENT') {
        record.timeIn = null;
        record.timeOut = null;
      }
    }

    const savedRecords = [];
    for (const record of records) {
      const saved = await prisma.attendance.upsert({
        where: {
          workerId_date: {
            workerId: record.workerId,
            date: normalizedDate
          }
        },
        update: {
          status: record.status,
          timeIn: record.timeIn || null,
          timeOut: record.timeOut || null,
        },
        create: {
          workerId: record.workerId,
          date: normalizedDate,
          status: record.status,
          timeIn: record.timeIn || null,
          timeOut: record.timeOut || null,
        }
      });
      savedRecords.push(saved);
    }

    await prisma.auditLog.create({
      data: {
        action: 'ATTENDANCE_MARKED',
        details: `Attendance marked for ${records.length} workers on ${normalizedDate.toISOString().split('T')[0]}`
      }
    })

    return NextResponse.json({ success: true, data: savedRecords })
  } catch (error) {
    console.error('Failed to save attendance:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to save attendance' } }, { status: 500 })
  }
}
