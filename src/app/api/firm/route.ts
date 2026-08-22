import { NextRequest, NextResponse } from 'next/server';
import { setFirmId } from '@/lib/firm';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firmId } = await req.json();
    if (!firmId || (firmId !== 'narmata' && firmId !== 'patil')) {
      return NextResponse.json({ error: 'Invalid firm' }, { status: 400 });
    }

    await setFirmId(firmId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
