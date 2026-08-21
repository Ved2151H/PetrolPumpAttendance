import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

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
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)
    
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
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayAttendances = weeklyAttendances.filter(a => {
        const aDate = new Date(a.date)
        return aDate.getFullYear() === d.getFullYear() && 
               aDate.getMonth() === d.getMonth() && 
               aDate.getDate() === d.getDate()
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
