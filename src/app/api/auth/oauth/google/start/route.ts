import { NextRequest, NextResponse } from 'next/server'
import { isOAuthConfigured, buildGoogleAuthUrl, generateOAuthState } from '@/lib/oauth'
import { cookies } from 'next/headers'

// GET /api/auth/oauth/google - start Google OAuth flow
export async function GET() {
  if (!isOAuthConfigured('google')) {
    return NextResponse.json(
      { error: 'Google OAuth не настроен. Установите GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET.' },
      { status: 503 }
    )
  }

  const state = generateOAuthState()

  // Store state in cookie for verification
  const cookieStore = await cookies()
  cookieStore.set('oauth_state_google', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  })

  return NextResponse.redirect(buildGoogleAuthUrl(state))
}
