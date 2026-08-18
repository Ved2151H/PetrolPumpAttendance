import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const workers = await prisma.worker.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: workers })
  } catch (error) {
    console.error('Failed to fetch workers:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch workers' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.name) {
      return NextResponse.json({ success: false, error: { message: 'Name is required' } }, { status: 400 })
    }
    if (!data.joiningDate) {
      return NextResponse.json({ success: false, error: { message: 'Joining Date is required' } }, { status: 400 })
    }
    
    // Add phone validation if needed, assuming simple non-empty string check for now
    if (data.phone && data.phone.trim().length < 8) {
      return NextResponse.json({ success: false, error: { message: 'Invalid phone number' } }, { status: 400 })
    }

    const newWorker = await prisma.worker.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        joiningDate: new Date(data.joiningDate),
        deletedAt: null
      }
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'WORKER_CREATED',
        details: `Worker ${newWorker.name} created`
      }
    })

    return NextResponse.json({ success: true, data: newWorker }, { status: 201 })
  } catch (error) {
    console.error('Failed to create worker:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to create worker' } }, { status: 500 })
  }
}
