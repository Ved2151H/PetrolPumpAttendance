import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    // Adjust for IST (+5:30) to get current Indian time
    const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const year = istNow.getUTCFullYear();
    const month = istNow.getUTCMonth();
    const day = istNow.getUTCDate();

    // Convert back to exact UTC midnight boundaries for DB querying
    const today = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
    const endOfToday = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))

    // Get total active workers
    const totalWorkers = await prisma.worker.count({
      where: { deletedAt: null }
    })

    // Get today's attendance
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lte: endOfToday
        }
      }
    })

    const uniqueToday = Array.from(new Map(todayAttendance.map(a => [a.workerId, a])).values());
    const presentToday = uniqueToday.filter(a => a.status === 'PRESENT').length;
    const absentToday = totalWorkers - presentToday;
    const attendanceRate = totalWorkers > 0 ? Math.min(100, Math.round((presentToday / totalWorkers) * 100)) : 0

    // Get weekly stats (last 7 days)
    const sevenDaysAgo = new Date(Date.UTC(year, month, day - 6, 0, 0, 0, 0))
    
    const weeklyAttendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
          lte: endOfToday
        }
      }
    })

    const weeklyStats = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(year, month, day - i, 0, 0, 0, 0))
      const dateStr = d.toISOString().split('T')[0]
      const dayAttendances = weeklyAttendances.filter(a => {
        const aDate = new Date(a.date)
        return aDate.getUTCFullYear() === d.getUTCFullYear() && 
               aDate.getUTCMonth() === d.getUTCMonth() && 
               aDate.getUTCDate() === d.getUTCDate()
      })
      const uniqueDayAttendances = Array.from(new Map(dayAttendances.map(a => [a.workerId, a])).values());
      const present = uniqueDayAttendances.filter(a => a.status === 'PRESENT').length
      const absent = totalWorkers - present
      weeklyStats.push({ date: dateStr, present, absent })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalWorkers,
        presentToday,
        absentToday,
        attendanceRate,
        weeklyStats
      }
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch stats' } }, { status: 500 })
  }
}
