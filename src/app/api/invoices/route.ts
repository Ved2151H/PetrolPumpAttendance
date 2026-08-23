export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFirmId } from '@/lib/firm';
import prisma from '@/lib/prisma';

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
      where: { firmId },
      orderBy: { date: 'desc' },
      include: { items: true }
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { customerName, customerPhone, customerAddress, items } = body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields or items list is empty' } }, { status: 400 });
    }

    // Server-side calculation to ensure security and prevent floating point errors
    let calculatedSubtotal = 0;
    const validatedItems = items.map((item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      const total = parseFloat((quantity * price).toFixed(2));
      calculatedSubtotal += total;

      return {
        materialName: item.materialName || '',
        quantity,
        unit: item.unit || 'Unit',
        price,
        total
      };
    });

    calculatedSubtotal = parseFloat(calculatedSubtotal.toFixed(2));
    const calculatedTotalAmount = calculatedSubtotal;

    let retries = 3;
    let newInvoice = null;

    while (retries > 0) {
      try {
        let nextNum = 10001;
        const lastInvoice = await prisma.invoice.findFirst({
          where: { firmId },
          orderBy: { invoiceNumber: 'desc' }
        });

        if (lastInvoice) {
          const match = lastInvoice.invoiceNumber.match(/\d+$/);
          if (match) {
            nextNum = parseInt(match[0], 10) + 1;
          }
        }
        
        const invoiceNumber = `NC-${nextNum}`;

        newInvoice = await prisma.invoice.create({
          data: {
            firmId,
            invoiceNumber,
            customerName,
            customerPhone,
            customerAddress,
            subtotal: calculatedSubtotal,
            totalAmount: calculatedTotalAmount,
            items: {
              create: validatedItems
            }
          },
          include: { items: true }
        });
        break; // Successfully created invoice
      } catch (err: any) {
        if (err.code === 'P2002' && retries > 1) {
          retries--;
          continue; // Retry with a newly generated invoice number
        }
        throw err;
      }
    }

    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
