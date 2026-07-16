'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2, CheckCircle2, Mail } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { OAuthButtons } from '@/components/oauth-buttons'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email.trim()) e.email = 'Email обязателен'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Некорректный email'
    if (!form.password) e.password = 'Пароль обязателен'
    else if (form.password.length < 8) e.password = 'Минимум 8 символов'
    else if (form.password.length > 128) e.password = 'Пароль слишком длинный (макс. 128 символов)'
    else if (!/[a-zA-Zа-яА-Я]/.test(form.password)) e.password = 'Нужна хотя бы одна буква'
    else if (!/[A-ZА-Я]/.test(form.password)) e.password = 'Нужна хотя бы одна заглавная буква'
    else if (!/[a-zа-я]/.test(form.password)) e.password = 'Нужна хотя бы одна строчная буква'
    else if (!/[0-9]/.test(form.password)) e.password = 'Нужна хотя бы одна цифра'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Пароли не совпадают'
    if (!agreeTerms) e.terms = 'Необходимо принять условия использования'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          rememberMe: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      toast({
        title: 'Аккаунт создан! 🎉',
        description: data.devVerifyUrl
          ? 'Проверьте почту для подтверждения email (dev-режим: ссылка в API-ответе)'
          : 'Проверьте почту для подтверждения email',
      })
      router.push('/')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Ошибка регистрации',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Начните изучать 7 языков мира бесплатно"
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Имя (необязательно)</Label>
          <Input
            id="name"
            type="text"
            placeholder="Как к вам обращаться?"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={loading}
            maxLength={80}
          />
        </div>

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
          <Label htmlFor="password">Пароль</Label>
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
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <CheckCircle2 className={`w-3 h-3 ${form.password.length >= 8 ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
              Минимум 8 символов
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className={`w-3 h-3 ${/[A-ZА-Я]/.test(form.password) ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
              Хотя бы одна заглавная буква
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className={`w-3 h-3 ${/[a-zа-я]/.test(form.password) ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
              Хотя бы одна строчная буква
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className={`w-3 h-3 ${/[0-9]/.test(form.password) ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
              Хотя бы одна цифра
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Повторите пароль"
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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(v) => setAgreeTerms(v === true)}
              disabled={loading}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              Я принимаю условия использования и политику конфиденциальности
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Создаём аккаунт...
            </>
          ) : (
            'Зарегистрироваться'
          )}
        </Button>
      </form>

      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <Mail className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          После регистрации мы отправим письмо для подтверждения email.
          Это повысит безопасность вашего аккаунта.
        </span>
      </div>

      <OAuthButtons />
    </AuthLayout>
  )
}
