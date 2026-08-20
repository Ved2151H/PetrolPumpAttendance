import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await params

    const existingNote = await prisma.note.findUnique({
      where: { id }
    })

    if (!existingNote || existingNote.adminId !== session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Note not found or unauthorized' } }, { status: 404 })
    }

    await prisma.note.update({
      where: { id },
      data: { deletedAt: null }
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Failed to restore note:', error)
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
  }
}
