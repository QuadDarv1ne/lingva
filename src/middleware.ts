import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'lingva_session'

const protectedRoutes = [
  '/dashboard',
  '/community',
  '/auth/profile',
]

const guestRoutes = [
  '/auth/login',
  '/auth/register',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  const isGuestOnly = guestRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isGuestOnly && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/community/:path*',
    '/auth/profile',
    '/auth/login',
    '/auth/register',
  ],
}
