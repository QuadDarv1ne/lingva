'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      setSubmitted(true)
      // In dev mode, show reset link directly
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Письмо отправлено"
        subtitle="Проверьте свою почту"
        footer={
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Вернуться ко входу
          </Link>
        }
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Если email <span className="font-medium text-foreground">{email}</span> существует,
            мы отправили инструкции по восстановлению пароля.
          </p>

          {devResetUrl && (
            <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-left text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                    Режим разработки
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 mb-2">
                    Email-сервис не настроен. Используйте эту ссылку для сброса пароля:
                  </p>
                  <Link
                    href={devResetUrl}
                    className="inline-block px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                  >
                    Открыть форму сброса →
                  </Link>
                </div>
              </div>
            </Card>
          )}

          <div className="text-xs text-muted-foreground">
            Не получили письмо? Проверьте папку «Спам» или{' '}
            <button
              onClick={() => setSubmitted(false)}
              className="text-primary hover:underline"
            >
              попробуйте ещё раз
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Восстановление пароля"
      subtitle="Введите email — пришлём инструкции для сброса"
      footer={
        <>
          Вспомнили пароль?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Отправляем...
            </>
          ) : (
            'Отправить инструкции'
          )}
        </Button>
      </form>

      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          В целях безопасности мы не сообщаем, существует ли email в нашей базе.
          Если письмо не пришло — возможно, аккаунта с таким email нет.
        </span>
      </div>
    </AuthLayout>
  )
}
