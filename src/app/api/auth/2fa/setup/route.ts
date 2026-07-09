import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  generateTwoFactorSecret,
  generateBackupCodes,
  hashBackupCodes,
  buildOtpAuthUri,
  generateQrCodeDataUrl,
} from '@/lib/two-factor'

// POST - Start 2FA setup: generate secret and QR code
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA уже включена. Сначала отключите.' },
        { status: 400 }
      )
    }

    const secret = generateTwoFactorSecret()
    const backupCodes = generateBackupCodes(8)
    const backupHash = hashBackupCodes(backupCodes)

    // Store secret temporarily (not yet enabled)
    // We'll store it on the user record but mark enabled=false until verified
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupHash: backupHash,
        // twoFactorEnabled stays false until verification
      },
    })

    // Build otpauth URI
    const uri = buildOtpAuthUri(secret, user.email)
    const qrDataUrl = await generateQrCodeDataUrl(uri)

    return NextResponse.json({
      success: true,
      secret, // Show as text for manual entry
      qrCode: qrDataUrl,
      otpauthUri: uri,
      backupCodes, // One-time display, user must save
      message: 'Отсканируйте QR-код в приложении Google Authenticator, затем введите код для подтверждения',
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ error: 'Ошибка настройки 2FA' }, { status: 500 })
  }
}

// DELETE - Cancel pending 2FA setup (clear secret)
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA уже включена, используйте отключение' },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: null,
        twoFactorBackupHash: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('2FA cancel setup error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
