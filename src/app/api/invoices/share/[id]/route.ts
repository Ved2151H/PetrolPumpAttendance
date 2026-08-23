export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
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

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!invoice || invoice.deletedAt) {
      return NextResponse.json({ success: false, error: { message: 'Invoice not found' } }, { status: 404 });
    }

    const serialized = serializeInvoice(invoice);
    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    console.error('Failed to fetch public invoice:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
