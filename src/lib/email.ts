// Email service: sends transactional emails
// In production: configure SMTP env vars (EMAIL_SERVER, EMAIL_FROM)
// In development: stores emails in memory and returns preview URL

import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
}

// In-memory store for dev mode (no SMTP configured)
const devEmailStore: EmailMessage[] = []
const MAX_DEV_EMAILS = 100

export interface SendResult {
  success: boolean
  // In dev mode, return a fake messageId
  messageId?: string
  // Preview of the sent email (dev mode only)
  devPreview?: EmailMessage
  error?: string
}

function isSmtpConfigured(): boolean {
  return !!(
    process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_PORT &&
    process.env.EMAIL_FROM
  )
}

// Singleton transporter — reused across calls
let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10) || 587,
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    auth: process.env.EMAIL_SERVER_USER
      ? {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        }
      : undefined,
  })
  return cachedTransporter
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to)) {
    return { success: false, error: 'Invalid recipient email' }
  }

  // If SMTP is configured, send real email
  if (isSmtpConfigured()) {
    try {
      const transporter = getTransporter()

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      })

      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Email send failed:', error)
      return {
        success: false,
        error: `SMTP delivery failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      }
    }
  }

  // Dev mode: store in memory and return preview (cap at MAX_DEV_EMAILS)
  if (devEmailStore.length >= MAX_DEV_EMAILS) {
    devEmailStore.shift()
  }
  devEmailStore.push(message)
  return {
    success: true,
    messageId: `dev-${randomBytes(8).toString('hex')}`,
    devPreview: message,
  }
}

// Get all dev-mode emails (for testing)
export function getDevEmails(): EmailMessage[] {
  return [...devEmailStore].reverse()
}

// Clear dev email store
export function clearDevEmails(): void {
  devEmailStore.length = 0
}

// Email templates
export interface ResetPasswordEmailData {
  to: string
  name?: string | null
  resetUrl: string
  expiresHours: number
}

export function renderResetPasswordEmail(data: ResetPasswordEmailData): EmailMessage {
  const name = data.name || ''
  const greeting = name ? `Здравствуйте, ${name}!` : 'Здравствуйте!'
  const greetingHtml = name ? `Здравствуйте, ${escapeHtml(name)}!` : 'Здравствуйте!'
  return {
    to: data.to,
    subject: 'Восстановление пароля — Лингва',
    text: `${greeting}\n\nВы запросили восстановление пароля на сайте Лингва.\n\nПерейдите по ссылке, чтобы установить новый пароль:\n${data.resetUrl}\n\nСсылка действительна ${data.expiresHours} час(ов).\n\nЕсли вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.\n\n— Команда Лингва`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Восстановление пароля</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #f43f5e, #f59e0b); border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">L</div>
      <h1 style="color: #111827; font-size: 24px; margin: 16px 0 8px;">Лингва</h1>
    </div>
    <p style="color: #374151; font-size: 16px; line-height: 1.5;">${greetingHtml}</p>
    <p style="color: #374151; font-size: 16px; line-height: 1.5;">Вы запросили восстановление пароля на сайте Лингва. Нажмите кнопку ниже, чтобы установить новый пароль:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${escapeHtml(data.resetUrl)}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Сбросить пароль</a>
    </div>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">Или скопируйте эту ссылку в адресную строку браузера:</p>
    <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #6b7280; font-family: monospace;">${escapeHtml(data.resetUrl)}</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">⏱️ Ссылка действительна ${data.expiresHours} час(ов).</p>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 13px;">Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо. Ваш аккаунт в безопасности.</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— Команда Лингва</p>
  </div>
</body>
</html>
`,
  }
}

export interface WelcomeEmailData {
  to: string
  name?: string | null
  verifyUrl?: string
}

export function renderWelcomeEmail(data: WelcomeEmailData): EmailMessage {
  const name = data.name || ''
  const greeting = name ? `Добро пожаловать, ${name}!` : 'Добро пожаловать!'
  const greetingHtml = name ? `Добро пожаловать, ${escapeHtml(name)}!` : 'Добро пожаловать!'
  const verifySection = data.verifyUrl
    ? `
    <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #92400e; font-weight: 600;">📧 Подтвердите ваш email</p>
      <p style="margin: 0 0 12px; color: #78350f; font-size: 14px;">Нажмите кнопку, чтобы подтвердить адрес электронной почты:</p>
      <a href="${escapeHtml(data.verifyUrl)}" style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Подтвердить email</a>
    </div>`
    : ''
  return {
    to: data.to,
    subject: 'Добро пожаловать в Лингва! 🎉',
    text: `${greeting}\n\nСпасибо за регистрацию в Лингва — платформе для изучения 7 языков мира: русский, китайский, арамейский, английский, греческий, славянский и церковнославянский.\n\nНачните прямо сейчас: откройте любой язык и изучите алфавит, фразы, уроки.\n\n${data.verifyUrl ? `Подтвердите email: ${data.verifyUrl}\n\n` : ''}Удачи в изучении языков!\n\n— Команда Лингва`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Добро пожаловать</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #f43f5e, #f59e0b); border-radius: 16px; line-height: 64px; color: white; font-size: 32px; font-weight: bold;">L</div>
      <h1 style="color: #111827; font-size: 28px; margin: 16px 0 8px;">${greetingHtml}</h1>
      <p style="color: #6b7280; font-size: 16px;">Спасибо за регистрацию в Лингва!</p>
    </div>
    ${verifySection}
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Теперь вам доступны 7 языков в одной платформе:</p>
    <ul style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
      <li>🇷🇺 Русский — язык Пушкина и Толстого</li>
      <li>🇨🇳 Китайский — язык Поднебесной</li>
      <li>📜 Арамейский — язык Иисуса</li>
      <li>🇬🇧 Английский — lingua franca мира</li>
      <li>🇬🇷 Греческий — язык Гомера и Платона</li>
      <li>📖 Славянский — язык Кирилла и Мефодия</li>
      <li>☦️ Церковный — язык православного богослужения</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Начать изучение →</a>
    </div>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #6b7280; font-size: 14px;">Удачи в изучении языков!</p>
    <p style="color: #6b7280; font-size: 14px;">— Команда Лингва</p>
  </div>
</body>
</html>
`,
  }
}

export interface VerifyEmailData {
  to: string
  name?: string | null
  verifyUrl: string
}

export function renderVerifyEmail(data: VerifyEmailData): EmailMessage {
  const name = data.name || ''
  const greeting = name ? `Здравствуйте, ${name}!` : 'Здравствуйте!'
  const greetingHtml = name ? `Здравствуйте, ${escapeHtml(name)}!` : 'Здравствуйте!'
  return {
    to: data.to,
    subject: 'Подтверждение email — Лингва',
    text: `${greeting}\n\nПодтвердите ваш email на сайте Лингва, перейдя по ссылке:\n${data.verifyUrl}\n\nЕсли вы не регистрировались, просто проигнорируйте это письмо.\n\n— Команда Лингва`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Подтверждение email</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #f43f5e, #f59e0b); border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">L</div>
      <h1 style="color: #111827; font-size: 24px; margin: 16px 0 8px;">Лингва</h1>
    </div>
    <p style="color: #374151; font-size: 16px; line-height: 1.5;">${greetingHtml}</p>
    <p style="color: #374151; font-size: 16px; line-height: 1.5;">Подтвердите ваш email, чтобы активировать все возможности аккаунта:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${escapeHtml(data.verifyUrl)}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e, #f59e0b); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Подтвердить email</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Или скопируйте ссылку: <span style="font-family: monospace; word-break: break-all;">${escapeHtml(data.verifyUrl)}</span></p>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 13px;">Если вы не регистрировались, просто проигнорируйте это письмо.</p>
  </div>
</body>
</html>
`,
  }
}
