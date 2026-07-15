import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  generateBackupCodes,
  hashBackupCodes,
  sanitizeToken,
  verifyTwoFactorToken,
} from '@/lib/two-factor'

// GET - Check if backup codes are available (count remaining)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { twoFactorBackupHash: true, twoFactorEnabled: true },
    })

    if (!fullUser?.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA не включена' },
        { status: 400 }
      )
    }

    const remaining = fullUser.twoFactorBackupHash
      ? fullUser.twoFactorBackupHash.split('|').length
      : 0

    return NextResponse.json({ remaining })
  } catch (error) {
    console.error('Get backup codes error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// POST - Regenerate backup codes (requires TOTP verification)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Введите TOTP код для подтверждения' },
        { status: 400 }
      )
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
    })
    if (!fullUser?.twoFactorEnabled || !fullUser.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA не включена' },
        { status: 400 }
      )
    }

    // Verify TOTP
    const sanitized = sanitizeToken(token)
    const valid = verifyTwoFactorToken(sanitized, fullUser.twoFactorSecret)
    if (!valid) {
      return NextResponse.json(
        { error: 'Неверный TOTP код' },
        { status: 401 }
      )
    }

    // Generate new backup codes
    const newCodes = generateBackupCodes(8)
    const newHash = hashBackupCodes(newCodes)

    await db.user.update({
      where: { id: user.id },
      data: { twoFactorBackupHash: newHash },
    })

    return NextResponse.json({
      success: true,
      backupCodes: newCodes,
      message: 'Новые бэкап-коды сгенерированы. Старые коды больше недействительны.',
    })
  } catch (error) {
    console.error('Regenerate backup codes error:', error)
    return NextResponse.json({ error: 'Ошибка генерации кодов' }, { status: 500 })
  }
}


