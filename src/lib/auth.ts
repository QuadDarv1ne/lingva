// Auth utilities: password hashing, session management
import { db } from '@/lib/db'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export const SESSION_COOKIE = 'lingva_session'
const SESSION_DURATION_DAYS = 30
const REMEMBER_ME_DURATION_DAYS = 90

// Simple PBKDF2-based password hashing using Web Crypto API
// (works in both Node.js Edge runtime and Node runtime)
const ITERATIONS = 100000
const KEY_LENGTH = 32

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return arr
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH * 8
  )
  return `${ITERATIONS}.${toHex(salt)}.${toHex(derived)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [iterStr, saltHex, hashHex] = stored.split('.')
    const iterations = parseInt(iterStr, 10)
    if (!iterations || !saltHex || !hashHex) return false

    const salt = fromHex(saltHex)
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      KEY_LENGTH * 8
    )
    const derivedHex = toHex(derived)
    if (derivedHex.length !== hashHex.length) return false
    return timingSafeEqual(Buffer.from(derivedHex), Buffer.from(hashHex))
  } catch {
    return false
  }
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export interface SessionMetadata {
  userAgent?: string
  ip?: string
}

export async function createSession(
  userId: string,
  metadata?: SessionMetadata,
  rememberMe: boolean = false
): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date()
  const days = rememberMe ? REMEMBER_ME_DURATION_DAYS : SESSION_DURATION_DAYS
  expiresAt.setDate(expiresAt.getDate() + days)

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: metadata?.userAgent?.slice(0, 500),
      ip: metadata?.ip?.slice(0, 50),
    },
  })
  return token
}

export async function getSessionUser(token: string | undefined) {
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session.user
}

export async function getSessionWithMeta(token: string | undefined) {
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session
}

export async function destroySession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } }).catch(() => {})
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } }).catch(() => {})
}

export async function getUserSessions(userId: string) {
  return db.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      token: true,
      createdAt: true,
      expiresAt: true,
      userAgent: true,
      ip: true,
    },
  })
}

export async function getCurrentUser(): Promise<{
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  twoFactorEnabled: boolean
} | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return getSessionUser(token)
}

export async function setSessionCookie(token: string, rememberMe: boolean = false) {
  const cookieStore = await cookies()
  const days = rememberMe ? REMEMBER_ME_DURATION_DAYS : SESSION_DURATION_DAYS
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: days * 24 * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}

// Extract IP and User-Agent from request
export function getRequestMetadata(req: NextRequest): SessionMetadata {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
  const userAgent = req.headers.get('user-agent') || undefined
  return { ip, userAgent }
}

// Password reset tokens
export function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// Email verification tokens
export function generateVerifyToken(): string {
  return randomBytes(32).toString('hex')
}

// Validation helpers
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Пароль должен содержать минимум 8 символов' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'Пароль слишком длинный (макс. 128 символов)' }
  }
  if (!/[a-zA-Zа-яА-Я]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну букву' }
  }
  if (!/[A-ZА-Я]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну заглавную букву' }
  }
  if (!/[a-zа-я]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну строчную букву' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну цифру' }
  }
  return { valid: true }
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Имя обязательно' }
  }
  if (name.length > 80) {
    return { valid: false, error: 'Имя слишком длинное (макс. 80 символов)' }
  }
  return { valid: true }
}

// Login attempt logging (for security audit)
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  metadata?: SessionMetadata
) {
  try {
    await db.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ip: metadata?.ip?.slice(0, 50),
        userAgent: metadata?.userAgent?.slice(0, 500),
        success,
      },
    })
  } catch {
    // ignore logging errors
  }
}

// Check rate limit: max 5 failed attempts per email per 15 minutes
export async function checkRateLimit(email: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - 15)

  const recentAttempts = await db.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gte: windowStart },
      success: false,
    },
  })

  const MAX_ATTEMPTS = 5
  return {
    allowed: recentAttempts < MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - recentAttempts),
  }
}

// Delete user account (cascades sessions and accounts)
export async function deleteUserAccount(userId: string): Promise<void> {
  await db.user.delete({ where: { id: userId } })
}
