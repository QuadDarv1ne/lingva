import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateResetToken, hashToken, validateEmail } from '@/lib/auth'
import { sendEmail, renderResetPasswordEmail } from '@/lib/email'

const resetRequests = new Map<string, { count: number; windowStart: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of resetRequests) {
    if (now - entry.windowStart > 60_000) {
      resetRequests.delete(key)
    }
  }
}, 5 * 60 * 1000)

function checkResetRateLimit(email: string): boolean {
  const now = Date.now()
  const key = `reset:${email.toLowerCase()}`
  const entry = resetRequests.get(key)
  if (!entry || now - entry.windowStart > 60_000) {
    resetRequests.set(key, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Некорректный email' },
        { status: 400 }
      )
    }

    if (!checkResetRateLimit(email)) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте через минуту.' },
        { status: 429 }
      )
    }

    const normalizedEmail = email.toLowerCase()
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    // For privacy reasons, always return success
    // (don't leak whether email exists)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Если email существует, инструкции отправлены',
      })
    }

    // Only allow password reset for users with a passwordHash
    // (OAuth-only users cannot reset password)
    if (!user.passwordHash) {
      return NextResponse.json({
        success: true,
        message: 'Если email существует, инструкции отправлены',
      })
    }

    // Generate reset token
    const rawToken = generateResetToken()
    const hashedToken = hashToken(rawToken)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExp: expiresAt,
      },
    })

    // Send reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`
    const emailResult = await sendEmail(
      renderResetPasswordEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresHours: 1,
      })
    )

    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      message: 'Если email существует, инструкции отправлены',
      // In dev mode, return token and URL for testing
      ...(isDev && emailResult.devPreview
        ? {
            devToken: rawToken,
            devResetUrl: `/auth/reset-password?token=${rawToken}`,
            devMessage: 'Email сохранён в dev-режиме (SMTP не настроен)',
          }
        : {}),
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Ошибка при сбросе пароля' },
      { status: 500 }
    )
  }
}
