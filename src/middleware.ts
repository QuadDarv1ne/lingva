import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'lingva_session'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/community',
  '/auth/profile',
]

// Routes that should redirect to dashboard if already authenticated
const guestRoutes = [
  '/auth/login',
  '/auth/register',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

  // Check if the current path matches a protected route
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Check if the current path is a guest-only route
  const isGuestOnly = guestRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from guest-only routes
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
