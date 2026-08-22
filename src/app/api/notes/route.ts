export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    let whereClause: any = { deletedAt: null };

    if (dateParam) {
      const parsedDate = parseISO(dateParam);
      whereClause.noteDate = {
        gte: startOfDay(parsedDate),
        lte: endOfDay(parsedDate),
      };
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: { noteDate: 'desc' },
      include: {
        admin: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, noteDate } = body;

    if (!title || !content || !noteDate) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 });
    }

    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        noteDate: new Date(noteDate),
        adminId: session.adminId,
      }
    });

    return NextResponse.json({ success: true, data: newNote }, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
