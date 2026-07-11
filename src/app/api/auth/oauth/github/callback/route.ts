import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOAuthUserInfo, findOrCreateOAuthUser, completeOAuthLogin } from '@/lib/oauth'

// GET /api/auth/oauth/github/callback?code=...&state=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(new URL('/auth/login?error=missing_params', req.url))
    }

    // Verify state cookie
    const cookieStore = await cookies()
    const storedState = cookieStore.get('oauth_state_github')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid_state', req.url))
    }

    // Clear state cookie
    cookieStore.delete('oauth_state_github')

    // Exchange code for user info
    const userInfo = await getOAuthUserInfo('github', code)
    const user = await findOrCreateOAuthUser(userInfo)

    // Create session and redirect to home
    return await completeOAuthLogin(user.id, req)
  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', req.url))
  }
}
