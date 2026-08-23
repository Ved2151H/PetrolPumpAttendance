export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFirmId } from '@/lib/firm';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  try {
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const firmId = await getFirmId();
    if (!firmId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized - No firm selected' } }, { status: 401 });
    }

    // Strict Tenant Isolation: Only Narmata Construction has access to invoices
    if (firmId !== 'narmata') {
      return NextResponse.json({ success: false, error: { message: 'Forbidden - Invoice management is only available for Narmata Construction' } }, { status: 403 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice || invoice.firmId !== firmId) {
      return NextResponse.json({ success: false, error: { message: 'Invoice not found or access denied' } }, { status: 404 });
    }

    // Cascade delete of items is configured on database/prisma layer, but let's run delete
    await prisma.invoice.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Failed to permanently delete invoice:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
