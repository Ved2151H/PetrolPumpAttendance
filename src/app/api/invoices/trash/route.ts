export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFirmId } from '@/lib/firm';
import prisma from '@/lib/prisma';

function serializeInvoice(invoice: any) {
  if (!invoice) return null;
  return {
    ...invoice,
    subtotal: parseFloat(invoice.subtotal.toString()),
    totalAmount: parseFloat(invoice.totalAmount.toString()),
    items: invoice.items?.map((item: any) => ({
      ...item,
      price: parseFloat(item.price.toString()),
      total: parseFloat(item.total.toString())
    })) || []
  };
}

export async function GET(req: NextRequest) {
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

    const invoices = await prisma.invoice.findMany({
      where: { 
        firmId,
        deletedAt: { not: null }
      },
      orderBy: { date: 'desc' },
      include: { items: true }
    });

    const serialized = invoices.map(invoice => serializeInvoice(invoice));

    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    console.error('Failed to fetch trashed invoices:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
