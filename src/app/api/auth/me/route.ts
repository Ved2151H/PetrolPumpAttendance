import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getFirmId } from '@/lib/firm'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const firmId = await getFirmId();
    let firmName = null;
    let companyAddress = null;
    let companyEmail = null;
    let supportContact = null;
    
    if (firmId) {
      const firm = await prisma.firm.findUnique({ where: { id: firmId } });
      if (firm) {
        firmName = firm.name;
        companyAddress = firm.companyAddress;
        companyEmail = firm.companyEmail;
        supportContact = firm.supportContact;
        if (firmName.includes("Narmata")) {
          firmName = firmName.replace("Narmata", "Namrata");
        }
        if (!firmName.endsWith("Private Limited")) {
          firmName += " Private Limited";
        }
      }
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { id: true, name: true, email: true, role: true, adminNumber: true }
    })

    if (!admin) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { ...admin, currentFirmId: firmId, currentFirmName: firmName, companyAddress, companyEmail, supportContact } })
  } catch (error) {
    console.error('Failed to fetch current user:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
