'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { useToast } from '@/hooks/use-toast'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(() => token ? 'idle' : 'error')
  const [error, setError] = useState<string | null>(() => token ? null : 'Токен не найден в URL')

  const verifyEmail = useCallback(async (t: string) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      setStatus('success')
      toast({
        title: 'Email подтверждён! ✅',
        description: 'Ваш аккаунт теперь полностью активирован',
      })
      setTimeout(() => router.push('/'), 3000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    }
  }, [router, toast])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => verifyEmail(token), 0)
    return () => clearTimeout(timer)
  }, [token, verifyEmail])

  if (status === 'loading' || status === 'idle') {
    return (
      <AuthLayout title="Подтверждение..." subtitle="Проверяем токен">
        <div className="flex flex-col items-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Подождите...</p>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout
        title="Email подтверждён!"
        subtitle="Перенаправляем на главную..."
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Ваш email успешно подтверждён. Теперь вам доступны все возможности Лингва.
          </p>
          <Link
            href="/"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Перейти к изучению →
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Ошибка подтверждения"
      subtitle={error || 'Не удалось подтвердить email'}
      footer={
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Войти в аккаунт
        </Link>
      }
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-rose-600" />
        </div>
        <p className="text-sm text-muted-foreground">
          {error || 'Токен недействителен или истёк.'}
        </p>
        <Link href="/auth/profile">
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Запросить новое письмо
          </Button>
        </Link>
      </div>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Загрузка..." subtitle="Пожалуйста, подождите">
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </AuthLayout>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}
