// 2FA TOTP utilities (Google Authenticator compatible)
// Using otplib v13+ standalone functions
import { generateSecret, verifySync } from 'otplib'
import { createHash, randomBytes } from 'crypto'

/**
 * Generate a new TOTP secret for a user (base32 encoded)
 */
export function generateTwoFactorSecret(): string {
  return generateSecret()
}

/**
 * Generate backup codes (8 codes, 8 chars each, format: XXXX-XXXX)
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(4)
    const hex = bytes.toString('hex').toUpperCase()
    codes.push(`${hex.slice(0, 4)}-${hex.slice(4)}`)
  }
  return codes
}

/**
 * Hash backup codes for secure storage (SHA-256)
 */
export function hashBackupCodes(codes: string[]): string {
  const hashed = codes.map((c) =>
    createHash('sha256').update(c.toUpperCase()).digest('hex')
  )
  return hashed.join('|')
}

/**
 * Remove a used backup code from the hash string
 * Returns new hash string and whether the code was found
 */
export function consumeBackupCode(
  storedHash: string,
  code: string
): { newHash: string; found: boolean } {
  if (!storedHash || !code) return { newHash: storedHash, found: false }
  const hashedCodes = storedHash.split('|')
  const codeHash = createHash('sha256').update(code.toUpperCase()).digest('hex')
  const idx = hashedCodes.indexOf(codeHash)
  if (idx === -1) return { newHash: storedHash, found: false }
  hashedCodes.splice(idx, 1)
  return { newHash: hashedCodes.join('|'), found: true }
}

/**
 * Verify a TOTP token against the secret
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    const result = verifySync({
      token: token.replace(/\s/g, ''),
      secret,
      digits: 6,
      period: 30,
      epochTolerance: 30, // allow ±1 time step drift (1 step = 30s)
    })
    return result.valid
  } catch {
    return false
  }
}

/**
 * Generate otpauth URI for QR code
 * Format: otpauth://totp/LABEL?secret=SECRET&issuer=ISSUER
 */
export function buildOtpAuthUri(
  secret: string,
  email: string,
  issuer: string = 'Лингва'
): string {
  const label = encodeURIComponent(`${issuer}:${email}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

/**
 * Generate QR code as data URL (PNG base64)
 */
export async function generateQrCodeDataUrl(uri: string): Promise<string> {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(uri, {
    width: 240,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}

/**
 * Sanitize token: remove spaces, dashes, only digits
 */
export function sanitizeToken(input: string): string {
  return input.replace(/[\s-]/g, '').replace(/\D/g, '').slice(0, 6)
}
