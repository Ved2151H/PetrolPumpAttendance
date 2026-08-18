import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const pumpInfo = await prisma.pumpInfo.findFirst()
    
    if (!pumpInfo) {
      return NextResponse.json({ success: true, data: { name: '', address: '' } })
    }

    return NextResponse.json({ success: true, data: pumpInfo })
  } catch (error) {
    console.error('Failed to fetch pump info:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { name, address } = await request.json()

    if (!name || !address) {
      return NextResponse.json({ success: false, error: { message: 'Pump name and address are required' } }, { status: 400 })
    }

    const existingInfo = await prisma.pumpInfo.findFirst()

    let updatedInfo;
    if (existingInfo) {
      updatedInfo = await prisma.pumpInfo.update({
        where: { id: existingInfo.id },
        data: { name, address }
      })
    } else {
      updatedInfo = await prisma.pumpInfo.create({
        data: { name, address }
      })
    }

    return NextResponse.json({ success: true, data: updatedInfo })
  } catch (error) {
    console.error('Failed to update pump info:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
