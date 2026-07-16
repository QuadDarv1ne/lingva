import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'lingva_session'
const TOKEN_HEX_LENGTH = 64

const protectedRoutes = [
  '/dashboard',
  '/community',
  '/auth/profile',
]

const guestRoutes = [
  '/auth/login',
  '/auth/register',
]

function isValidToken(token: string): boolean {
  return token.length === TOKEN_HEX_LENGTH && /^[0-9a-f]+$/.test(token)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
  const hasValidSession = !!sessionToken && isValidToken(sessionToken)

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  const isGuestOnly = guestRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (isProtected && !hasValidSession) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isGuestOnly && hasValidSession) {
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
