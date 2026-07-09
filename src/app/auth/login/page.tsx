'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { OAuthButtons } from '@/components/oauth-buttons'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If 2FA required, handle TOTP/backup code submission
    if (requiresTwoFactor && userId) {
      if (useBackupCode) {
        if (!backupCode) {
          toast({ title: 'Введите бэкап-код', variant: 'destructive' })
          return
        }
      } else {
        if (!twoFactorToken || twoFactorToken.length !== 6) {
          toast({ title: 'Введите 6-значный код', variant: 'destructive' })
          return
        }
      }

      setLoading(true)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            rememberMe,
            userId,
            twoFactorToken: useBackupCode ? undefined : twoFactorToken,
            backupCode: useBackupCode ? backupCode : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Ошибка')

        toast({
          title: 'С возвращением! 👋',
          description: data.user?.name ? `Здравствуйте, ${data.user.name}` : 'Вы вошли в аккаунт',
        })
        router.push('/')
        router.refresh()
      } catch (error) {
        toast({
          title: 'Ошибка входа',
          description: error instanceof Error ? error.message : 'Неизвестная ошибка',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
      return
    }

    const err: Record<string, string> = {}
    if (!form.email.trim()) err.email = 'Email обязателен'
    if (!form.password) err.password = 'Пароль обязателен'
    setErrors(err)
    if (Object.keys(err).length > 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rememberMe }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      // If 2FA required, switch to 2FA form
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setUserId(data.userId)
        setLoading(false)
        return
      }

      toast({
        title: 'С возвращением! 👋',
        description: data.user?.name ? `Здравствуйте, ${data.user.name}` : 'Вы вошли в аккаунт',
      })

      if (data.user?.emailVerified === false) {
        toast({
          title: 'Email не подтверждён',
          description: 'Перейдите в профиль, чтобы запросить письмо для подтверждения',
        })
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 2FA verification form
  if (requiresTwoFactor) {
    return (
      <AuthLayout
        title="Двухфакторная аутентификация"
        subtitle="Введите код из приложения"
        footer={
          <button
            onClick={() => {
              setRequiresTwoFactor(false)
              setUserId(null)
              setTwoFactorToken('')
              setBackupCode('')
              setUseBackupCode(false)
            }}
            className="font-medium text-primary hover:underline"
          >
            ← Вернуться к входу
          </button>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          {!useBackupCode ? (
            <div className="space-y-2">
              <Label htmlFor="twoFactorToken">Код аутентификатора</Label>
              <Input
                id="twoFactorToken"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={twoFactorToken}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setTwoFactorToken(val)
                }}
                disabled={loading}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Введите 6-значный код из Google Authenticator
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="backupCode">Бэкап-код</Label>
              <Input
                id="backupCode"
                type="text"
                placeholder="XXXX-XXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                disabled={loading}
                className="text-center font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Каждый бэкап-код можно использовать только один раз
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Проверяем...
              </>
            ) : (
              'Подтвердить вход'
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setUseBackupCode((v) => !v)
              setTwoFactorToken('')
              setBackupCode('')
            }}
            className="w-full text-xs text-muted-foreground hover:text-primary"
          >
            {useBackupCode ? '← Использовать код аутентификатора' : 'Не можете войти? Использовать бэкап-код'}
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Вход в аккаунт"
      subtitle="Продолжайте изучение языков с того же места"
      footer={
        <div className="flex flex-col gap-2">
          <div>
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </div>
          <div>
            Забыли пароль?{' '}
            <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
              Восстановить
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@mail.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={loading}
            autoComplete="email"
            required
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Пароль</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Забыли?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ваш пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
              autoComplete="current-password"
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

        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(v) => setRememberMe(v === true)}
            disabled={loading}
          />
          <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
            Запомнить меня на 90 дней
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Вход...
            </>
          ) : (
            'Войти'
          )}
        </Button>
      </form>

      <OAuthButtons />
    </AuthLayout>
  )
}
