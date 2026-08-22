import { NextResponse } from 'next/server'
import { getSession, clearSession } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function POST() {
  try {
    const session = await getSession()
    if (session && session.adminId) {
      // Fire and forget audit log
      createAuditLog(session.adminId, 'LOGOUT', 'Admin logged out', 'Auth', session.adminId).catch(console.error)
    }

    await clearSession()

    return NextResponse.json({ success: true, data: {} })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
