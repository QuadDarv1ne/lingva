'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { useToast } from '@/hooks/use-toast'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <AuthLayout
        title="Неверная ссылка"
        subtitle="Ссылка сброса пароля недействительна"
        footer={
          <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
            Запросить новую ссылку
          </Link>
        }
      >
        <div className="text-center text-sm text-muted-foreground">
          В ссылке отсутствует токен сброса пароля. Пожалуйста, запросите
          новую ссылку восстановления.
        </div>
      </AuthLayout>
    )
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.password) e.password = 'Пароль обязателен'
    else if (form.password.length < 8) e.password = 'Минимум 8 символов'
    else if (!/[a-zA-Zа-яА-Я]/.test(form.password)) e.password = 'Нужна хотя бы одна буква'
    else if (!/[0-9]/.test(form.password)) e.password = 'Нужна хотя бы одна цифра'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Пароли не совпадают'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      setSuccess(true)
      toast({
        title: 'Пароль изменён! ✅',
        description: 'Теперь войдите с новым паролем',
      })
      setTimeout(() => {
        router.push('/auth/login')
      }, 2500)
    } catch (error) {
      toast({
        title: 'Ошибка сброса',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Пароль изменён!"
        subtitle="Перенаправляем на страницу входа..."
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Ваш пароль успешно изменён. Теперь вы можете войти в аккаунт с новым паролем.
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Перейти ко входу →
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Новый пароль"
      subtitle="Придумайте новый пароль для аккаунта"
      footer={
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Вернуться ко входу
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Новый пароль</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Минимум 8 символов"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Повторите новый пароль"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            disabled={loading}
            autoComplete="new-password"
            required
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Сохраняем...
            </>
          ) : (
            'Изменить пароль'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  )
}
