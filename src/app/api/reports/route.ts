import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

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

    const dates: Date[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    const formatDisplayTime = (time24: string | null) => {
      if (!time24) return '-';
      const [h, m] = time24.split(':');
      let hours = parseInt(h, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
    };

    const getWorkingMinutes = (tIn: string | null, tOut: string | null) => {
      if (!tIn || !tOut) return null;
      const [h1, m1] = tIn.split(':').map(Number);
      const [h2, m2] = tOut.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 24 * 60; // handle overnight if any
      return diff;
    };

    const formatMinutes = (m: number | null) => {
      if (m === null) return '-';
      const h = Math.floor(m / 60);
      const mns = m % 60;
      return `${h}h ${mns.toString().padStart(2, '0')}m`;
    };

    const detailedRows: any[] = [];
    const summaryMap = new Map<string, { name: string, days: number, mins: number }>();

    workers.forEach(w => {
      summaryMap.set(w.id, { name: w.name, days: 0, mins: 0 });
    });

    for (const d of dates) {
      const dStr = d.toISOString().split('T')[0];
      const dFmt = format(d, 'dd/MM/yyyy');

      for (const w of workers) {
        const joined = new Date(w.joiningDate) <= d;
        const isDeleted = w.deletedAt && new Date(w.deletedAt) < d;
        
        const att = attendances.find(a => a.workerId === w.id && a.date.toISOString().split('T')[0] === dStr);
        
        if (!joined) continue;
        if (isDeleted && !att) continue;

        const status = att ? (att.status === 'PRESENT' ? 'Present' : 'Absent') : 'Absent';
        const tIn = att?.timeIn || null;
        const tOut = att?.timeOut || null;
        const mins = getWorkingMinutes(tIn, tOut);

        detailedRows.push([
          dFmt,
          w.name,
          status,
          formatDisplayTime(tIn),
          formatDisplayTime(tOut),
          formatMinutes(mins)
        ]);

        if (status === 'Present') {
          const s = summaryMap.get(w.id)!;
          s.days += 1;
          if (mins !== null) {
            s.mins += mins;
          }
        }
      }
    }

    const aoa: any[][] = [];
    aoa.push(['ATTENDANCE REPORT']);

    const isSingleDay = startDate.toDateString() === endDate.toDateString();
    if (isSingleDay) {
      aoa.push([`Date: ${format(startDate, 'dd MMMM yyyy')}`]);
    } else {
      aoa.push([`Period: ${format(startDate, 'dd MMMM yyyy')} - ${format(endDate, 'dd MMMM yyyy')}`]);
    }
    
    aoa.push([]);
    aoa.push(['Date', 'Worker', 'Status', 'Time In', 'Time Out', 'Working Hours']);
    aoa.push(...detailedRows);
    
    aoa.push([]);
    aoa.push([]);
    aoa.push(['WORKER SUMMARY']);
    aoa.push(['Worker', 'Working Days', 'Total Working Hours']);
    
    // Filter summary to only those who were eligible for at least one day in the report range
    // meaning they have been evaluated in detailedRows, or they just exist. 
    // We'll show all active + deleted with attendance.
    const activeWorkers = workers.filter(w => !w.deletedAt || attendances.some(a => a.workerId === w.id));
    for (const w of activeWorkers) {
      const s = summaryMap.get(w.id)!;
      // If a worker has 0 days, total working hours might be '0h 00m'. Let's show it explicitly.
      aoa.push([s.name, s.days, formatMinutes(s.mins === 0 && s.days === 0 ? null : s.mins)]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Apply basic column widths
    ws['!cols'] = [
      { wch: 15 }, // Date
      { wch: 25 }, // Worker
      { wch: 15 }, // Status
      { wch: 15 }, // Time In
      { wch: 15 }, // Time Out
      { wch: 20 }  // Working Hours
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    await prisma.auditLog.create({
      data: {
        action: 'REPORT_GENERATED',
        details: `Generated attendance report from ${startDateStr} to ${endDateStr}`
      }
    });

    return new NextResponse(buf, {
      headers: {
        'Content-Disposition': `attachment; filename="Attendance_Report_${startDateStr}_to_${endDateStr}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json({ success: false, error: { message: 'Failed to generate report' } }, { status: 500 });
  }
}
