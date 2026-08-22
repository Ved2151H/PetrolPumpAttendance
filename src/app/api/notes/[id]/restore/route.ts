import { getFirmId } from '@/lib/firm';
﻿export const dynamic = 'force-dynamic'
import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const firmId = await getFirmId();
  if (!firmId) return NextResponse.json({ success: false, error: { message: 'Unauthorized - No firm selected' } }, { status: 401 });

  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await params

    const existingNote = await prisma.note.findUnique({
      where: { firmId,  id }
    })

    if (!existingNote || false) {
      return NextResponse.json({ success: false, error: { message: 'Note not found or unauthorized' } }, { status: 404 })
    }

    await prisma.note.update({
      where: { firmId,  id },
      data: { firmId,  deletedAt: null }
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Failed to restore note:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}

