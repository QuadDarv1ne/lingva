import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  hashPassword,
  createSession,
  setSessionCookie,
  validateEmail,
  validatePassword,
  validateName,
  generateVerifyToken,
  hashToken,
  getRequestMetadata,
} from '@/lib/auth'
import { sendEmail, renderWelcomeEmail } from '@/lib/email'

// Per-IP registration rate limiting
const registerAttempts = new Map<string, { count: number; windowStart: number }>()
const MAX_REGISTERS_PER_HOUR = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

let lastCleanup = 0
function cleanupRegisterLimits() {
  const now = Date.now()
  if (now - lastCleanup < RATE_WINDOW_MS) return
  lastCleanup = now
  for (const [key, entry] of registerAttempts) {
    if (now - entry.windowStart > RATE_WINDOW_MS) {
      registerAttempts.delete(key)
    }
  }
}

function checkRegisterRateLimit(ip: string): boolean {
  cleanupRegisterLimits()
  const now = Date.now()
  const entry = registerAttempts.get(ip)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    registerAttempts.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_REGISTERS_PER_HOUR) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, rememberMe } = body

    // Rate limit by IP
    const metadata = getRequestMetadata(req)
    const ip = metadata.ip || 'unknown'
    if (!checkRegisterRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Слишком много регистраций. Попробуйте позже.' },
        { status: 429 }
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Некорректный email' },
        { status: 400 }
      )
    }

    const pwdCheck = validatePassword(password)
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.error }, { status: 400 })
    }

    const trimmedName = (name || '').toString().trim()
    if (trimmedName) {
      const nameCheck = validateName(trimmedName)
      if (!nameCheck.valid) {
        return NextResponse.json({ error: nameCheck.error }, { status: 400 })
      }
    }

    const passwordHash = await hashPassword(password)

    // Generate email verification token
    const rawVerifyToken = generateVerifyToken()
    const hashedVerifyToken = hashToken(rawVerifyToken)
    const verifyTokenExp = new Date()
    verifyTokenExp.setHours(verifyTokenExp.getHours() + 24) // 24 hours

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: trimmedName || null,
        passwordHash,
        verifyToken: hashedVerifyToken,
        verifyTokenExp,
      },
    })

    const token = await createSession(user.id, metadata, !!rememberMe)
    await setSessionCookie(token, !!rememberMe)

    // Send welcome email with verification link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verifyUrl = `${appUrl}/auth/verify-email?token=${rawVerifyToken}`
    const emailResult = await sendEmail(
      renderWelcomeEmail({
        to: user.email,
        name: user.name,
        verifyUrl,
      })
    )

    // In dev mode, return the dev preview info (for testing)
    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      ...(isDev && emailResult.devPreview
        ? {
            devEmailSent: true,
            devVerifyUrl: verifyUrl,
            devMessage: 'Email сохранён в dev-режиме (SMTP не настроен)',
          }
        : {}),
    })
  } catch (error) {
    console.error('Register error:', error)
    // Handle Prisma unique constraint violation (race condition)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as Record<string, unknown>).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Ошибка при регистрации. Попробуйте ещё раз.' },
      { status: 500 }
    )
  }
}
