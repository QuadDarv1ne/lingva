import { NextResponse } from 'next/server'
import { isOAuthConfigured, buildGitHubAuthUrl, generateOAuthState } from '@/lib/oauth'
import { cookies } from 'next/headers'

// GET /api/auth/oauth/github - start GitHub OAuth flow
export async function GET() {
  if (!isOAuthConfigured('github')) {
    return NextResponse.json(
      { error: 'GitHub OAuth не настроен. Установите GITHUB_CLIENT_ID и GITHUB_CLIENT_SECRET.' },
      { status: 503 }
    )
  }

  const state = generateOAuthState()

  // Store state in cookie for verification
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  })

  return NextResponse.redirect(buildGitHubAuthUrl(state))
}
