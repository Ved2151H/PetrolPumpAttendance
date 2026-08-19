import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './lib/auth'

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isProtected = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/attendance') || 
    request.nextUrl.pathname.startsWith('/workers') || 
    request.nextUrl.pathname.startsWith('/reports') || 
    request.nextUrl.pathname.startsWith('/settings')

  // We are currently simulating the check in the middleware. 
  // In a real Edge environment with jose, we check the cookie.
  const sessionCookie = request.cookies.get('session')?.value
  
  // NOTE: Full jwt verification is tricky in Edge sometimes, 
  // but `jose` supports Edge runtime. For now we just check if it exists.
  
  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/attendance/:path*', '/workers/:path*', '/reports/:path*', '/settings/:path*', '/login'],
}
