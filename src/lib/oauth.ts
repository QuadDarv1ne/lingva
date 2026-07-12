// OAuth helpers for Google and GitHub
import { db } from '@/lib/db'
import { createSession, setSessionCookie, generateToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export interface OAuthUserInfo {
  provider: string
  providerAccountId: string
  email: string
  name?: string | null
  avatar?: string | null
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

// Google OAuth URLs
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

// GitHub OAuth URLs
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USERINFO_URL = 'https://api.github.com/user'

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/google/callback`
  return { clientId, clientSecret, redirectUri }
}

export function getGitHubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/github/callback`
  return { clientId, clientSecret, redirectUri }
}

export function isOAuthConfigured(provider: 'google' | 'github'): boolean {
  if (provider === 'google') {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  }
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
}

export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleConfig()
  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export function buildGitHubAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGitHubConfig()
  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
  })
  return `${GITHUB_AUTH_URL}?${params.toString()}`
}

async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig()
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured')
  }
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    throw new Error('Failed to exchange Google code')
  }
  return res.json()
}

async function exchangeGitHubCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGitHubConfig()
  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth is not configured')
  }
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) {
    throw new Error('Failed to exchange GitHub code')
  }
  return res.json()
}

async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Google user info')
  return res.json()
}

async function getGitHubUserInfo(accessToken: string) {
  const res = await fetch(GITHUB_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch GitHub user info')
  return res.json()
}

type GitHubEmail = { email: string; primary: boolean; verified: boolean }

async function getGitHubEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const emails: GitHubEmail[] = await res.json()
  const primary = emails.find((e) => e.primary && e.verified)
  return primary?.email || null
}

/**
 * Exchange code for user info from OAuth provider
 */
export async function getOAuthUserInfo(
  provider: 'google' | 'github',
  code: string
): Promise<OAuthUserInfo> {
  if (provider === 'google') {
    const tokenData = await exchangeGoogleCode(code)
    const userInfo = await getGoogleUserInfo(tokenData.access_token)
    return {
      provider: 'google',
      providerAccountId: String(userInfo.id),
      email: userInfo.email,
      name: userInfo.name || userInfo.given_name || null,
      avatar: userInfo.picture || null,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : undefined,
    }
  } else {
    const tokenData = await exchangeGitHubCode(code)
    const userInfo = await getGitHubUserInfo(tokenData.access_token)
    let email = userInfo.email
    if (!email) {
      email = await getGitHubEmail(tokenData.access_token) || ''
    }
    return {
      provider: 'github',
      providerAccountId: String(userInfo.id),
      email,
      name: userInfo.name || userInfo.login || null,
      avatar: userInfo.avatar_url || null,
      accessToken: tokenData.access_token,
    }
  }
}

/**
 * Find or create user from OAuth info
 */
export async function findOrCreateOAuthUser(info: OAuthUserInfo) {
  if (!info.email) {
    throw new Error('Email is required from OAuth provider')
  }

  const normalizedEmail = info.email.toLowerCase()

  // 1. Check if account already linked
  const existingAccount = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: info.provider,
        providerAccountId: info.providerAccountId,
      },
    },
    include: { user: true },
  })

  if (existingAccount) {
    // Update tokens
    await db.account.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: info.accessToken,
        refreshToken: info.refreshToken,
        expiresAt: info.expiresAt,
      },
    })
    return existingAccount.user
  }

  // 2. Check if user exists with this email
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    // Link this OAuth account to existing user
    await db.account.create({
      data: {
        userId: existingUser.id,
        provider: info.provider,
        providerAccountId: info.providerAccountId,
        accessToken: info.accessToken,
        refreshToken: info.refreshToken,
        expiresAt: info.expiresAt,
      },
    })
    return existingUser
  }

  // 3. Create new user with OAuth account
  const newUser = await db.user.create({
    data: {
      email: normalizedEmail,
      name: info.name,
      // No passwordHash - OAuth-only user
      emailVerified: true, // OAuth providers verify email
      accounts: {
        create: {
          provider: info.provider,
          providerAccountId: info.providerAccountId,
          accessToken: info.accessToken,
          refreshToken: info.refreshToken,
          expiresAt: info.expiresAt,
        },
      },
    },
  })

  return newUser
}

/**
 * Create session and set cookie after OAuth login
 */
export async function completeOAuthLogin(
  userId: string,
  req: NextRequest
): Promise<NextResponse> {
  const metadata = {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  }
  const token = await createSession(userId, metadata, true)
  await setSessionCookie(token, true)
  return NextResponse.redirect(new URL('/', req.url))
}

/**
 * Generate random state for OAuth CSRF protection
 */
export function generateOAuthState(): string {
  return generateToken()
}
