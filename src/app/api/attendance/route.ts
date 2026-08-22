import { getFirmId } from '@/lib/firm';
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const firmId = await getFirmId();
  if (!firmId) return NextResponse.json({ success: false, error: { message: 'Unauthorized - No firm selected' } }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    
    if (!dateStr) {
      return NextResponse.json({ success: false, error: { message: 'Date parameter is required' } }, { status: 400 })
    }

    const inputDate = new Date(dateStr)
    const istTime = new Date(inputDate.getTime() + (5.5 * 60 * 60 * 1000));
    const year = istTime.getUTCFullYear();
    const month = istTime.getUTCMonth();
    const day = istTime.getUTCDate();

    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    const attendances = await prisma.attendance.findMany({
      where: {
        worker: { firmId },
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        worker: true
      }
    })

    const activeWorkers = await prisma.worker.findMany({
      where: { deletedAt: null, firmId }
    })

    const uniqueAttendances = Array.from(new Map(attendances.map(a => [a.workerId, a])).values());
    const attendanceMap = new Map(uniqueAttendances.map(a => [a.workerId, a]));

    const fullAttendanceList = activeWorkers.map(worker => {
      if (attendanceMap.has(worker.id)) {
        return attendanceMap.get(worker.id);
      }
      return {
        id: `synthetic-${worker.id}`,
        workerId: worker.id,
        date: startOfDay,
        status: 'ABSENT',
        timeIn: null,
        timeOut: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        worker: worker
      };
    });

    return NextResponse.json({ success: true, data: fullAttendanceList })
  } catch (error) {
    console.error('Failed to fetch attendance:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch attendance' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const firmId = await getFirmId();
  if (!firmId) return NextResponse.json({ success: false, error: { message: 'Unauthorized - No firm selected' } }, { status: 401 });

  try {
    const data = await request.json()
    const { date, records } = data 

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: { message: 'Invalid payload' } }, { status: 400 })
    }

    const inputTargetDate = new Date(date)
    const currentDate = new Date()
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(currentDate.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    
    if (inputTargetDate < sevenDaysAgo) {
      return NextResponse.json({ success: false, error: { message: 'Cannot edit attendance older than 7 days' } }, { status: 400 })
    }

    const istTargetTime = new Date(inputTargetDate.getTime() + (5.5 * 60 * 60 * 1000));
    const normalizedDate = new Date(Date.UTC(istTargetTime.getUTCFullYear(), istTargetTime.getUTCMonth(), istTargetTime.getUTCDate()));

    for (const record of records) {
      if (record.status === 'ABSENT') {
        record.timeIn = null;
        record.timeOut = null;
      }
    }

    // Verify all workers belong to firm
    const workerIds = records.map(r => r.workerId);
    const validWorkers = await prisma.worker.count({
      where: { id: { in: workerIds }, firmId }
    });
    if (validWorkers !== workerIds.length) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized worker modification' } }, { status: 403 })
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
        firmId,
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
