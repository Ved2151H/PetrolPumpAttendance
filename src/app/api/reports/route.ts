import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ success: false, error: { message: 'Start date and end date are required' } }, { status: 400 })
    }

    const startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)

    // Fetch data
    const workers = await prisma.worker.findMany({
      orderBy: { name: 'asc' }
    })
    
    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    })

    // Prepare Summary Sheet Data
    const summaryData = workers
      .filter(worker => worker.deletedAt === null || attendances.some(a => a.workerId === worker.id))
      .map(worker => {
      const workerRecords = attendances.filter(a => a.workerId === worker.id)
      const present = workerRecords.filter(a => a.status === 'PRESENT').length
      const absent = workerRecords.filter(a => a.status === 'ABSENT').length
      const total = present + absent
      const rate = total > 0 ? ((present / total) * 100).toFixed(2) + '%' : '0%'
      
      return {
        Worker: worker.name,
        Present: present,
        Absent: absent,
        'Attendance %': rate
      }
    })

    // Prepare Detailed Sheet Data
    // Group attendances by date
    const dateMap = new Map<string, any>()
    
    // First setup empty records for all dates
    attendances.forEach(att => {
      const dateKey = att.date.toISOString().split('T')[0]
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { Date: dateKey })
      }
      
      const record = dateMap.get(dateKey)
      const worker = workers.find(w => w.id === att.workerId)
      if (worker) {
        record[worker.name] = att.status
      }
    })

    const detailedData = Array.from(dateMap.values())

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    if (detailedData.length > 0) {
      const wsDetailed = XLSX.utils.json_to_sheet(detailedData)
      XLSX.utils.book_append_sheet(wb, wsDetailed, 'Daily Details')
    }

    // Write to buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    await prisma.auditLog.create({
      data: {
        action: 'REPORT_GENERATED',
        details: `Generated attendance report from ${startDateStr} to ${endDateStr}`
      }
    })

    return new NextResponse(buf, {
      headers: {
        'Content-Disposition': `attachment; filename="Attendance_Report_${startDateStr}_to_${endDateStr}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to generate report' } }, { status: 500 })
  }
}
