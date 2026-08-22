export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Auto-cleanup: permanently delete notes in trash older than 15 days
    const fifteenDaysAgo = subDays(new Date(), 15);
    
    await prisma.note.deleteMany({
      where: {
        deletedAt: {
          lte: fifteenDaysAgo
        }
      }
    });

    // Fetch remaining trashed notes
    const trashedNotes = await prisma.note.findMany({
      where: { 
        deletedAt: {
          not: null
        }
      },
      orderBy: { deletedAt: 'desc' },
      include: {
        admin: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: trashedNotes });
  } catch (error) {
    console.error('Failed to fetch trashed notes:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
