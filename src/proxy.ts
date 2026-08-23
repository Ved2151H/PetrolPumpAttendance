import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from './lib/auth'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isLoginPage = path === '/login' || path === '/api/auth/login'
  const isApiRoute = path.startsWith('/api')
  const isProtected = 
    path.startsWith('/dashboard') || 
    path.startsWith('/attendance') || 
    path.startsWith('/workers') || 
    path.startsWith('/reports') || 
    path.startsWith('/settings') ||
    (isApiRoute && 
     !path.startsWith('/api/auth/login') && 
     !path.startsWith('/api/auth/logout') && 
     !path.startsWith('/api/invoices/share/'))

  const sessionCookie = request.cookies.get('session')?.value
  let isValidSession = false;

  if (sessionCookie) {
    try {
      const payload = await decrypt(sessionCookie)
      if (payload && payload.adminId) {
        isValidSession = true
      }
    } catch (err) {
      isValidSession = false
    }
  }
  
  if (isProtected && !isValidSession) {
    if (isApiRoute) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/attendance/:path*', '/workers/:path*', '/reports/:path*', '/settings/:path*', '/login', '/api/:path*'],
}
