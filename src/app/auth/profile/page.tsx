'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TwoFactorTab } from '@/components/two-factor-tab'
import {
  Eye, EyeOff, Loader2, User, Lock, LogOut, Mail, Save,
  AlertCircle, Shield, Trash2, Send,
  CheckCircle2, Clock, Globe,
} from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface SessionInfo {
  id: string
  createdAt: string
  expiresAt: string
  ip: string | null
  browser: string
  os: string
  device: string
  isCurrent: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading, logout, updateProfile, changePassword } = useAuth()

  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const [deleteForm, setDeleteForm] = useState({ password: '', confirm: '' })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [resendLoading, setResendLoading] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [authLoading, user, router])

  // Pre-fill form on mount
  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      setProfileForm({ name: user.name || '', email: user.email })
    }, 0)
    return () => clearTimeout(timer)
  }, [user])

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/auth/sessions')
      const data = await res.json()
      if (res.ok) {
        setSessions(data.sessions || [])
      }
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
      })
      toast({ title: 'Профиль обновлён ✅' })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить',
        variant: 'destructive',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Пароли не совпадают', variant: 'destructive' })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Слишком короткий пароль',
        description: 'Минимум 8 символов',
        variant: 'destructive',
      })
      return
    }
    setPasswordLoading(true)
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      toast({ title: 'Пароль изменён ✅' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сменить пароль',
        variant: 'destructive',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      toast({
        title: 'Письмо отправлено 📧',
        description: data.devVerifyUrl
          ? 'Dev-режим: ссылка доступна в ответе API'
          : 'Проверьте вашу почту',
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить',
        variant: 'destructive',
      })
    } finally {
      setResendLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions?id=${sessionId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      toast({ title: 'Сессия завершена' })
      loadSessions()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    }
  }

  const handleTerminateAllSessions = async () => {
    if (!confirm('Завершить все другие сессии? Вы останетесь в текущей.')) return
    try {
      const res = await fetch('/api/auth/sessions?all=true', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      toast({ title: 'Все другие сессии завершены' })
      loadSessions()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deleteForm.confirm !== 'УДАЛИТЬ') {
      toast({
        title: 'Подтверждение не совпадает',
        description: 'Введите "УДАЛИТЬ" заглавными буквами',
        variant: 'destructive',
      })
      return
    }
    if (!confirm('ВНИМАНИЕ! Это действие необратимо. Все ваши данные, прогресс и достижения будут удалены навсегда. Продолжить?')) {
      return
    }
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deleteForm.password,
          confirm: deleteForm.confirm,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      toast({
        title: 'Аккаунт удалён',
        description: 'Все ваши данные стёрты',
      })
      router.push('/')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить аккаунт',
        variant: 'destructive',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  if (authLoading) {
    return (
      <AuthLayout title="Загрузка..." subtitle="Проверяем авторизацию">
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    )
  }

  if (!user) return null

  return (
    <AuthLayout
      title="Профиль"
      subtitle="Управляйте аккаунтом и безопасностью"
      footer={
        <Link href="/" className="font-medium text-primary hover:underline">
          ← Вернуться к изучению
        </Link>
      }
    >
      <div className="mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold">
          {(user.name || user.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate flex items-center gap-2 flex-wrap">
            {user.name || 'Без имени'}
            {user.emailVerified ? (
              <Badge variant="secondary" className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Email подтверждён
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-amber-700 bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-3 h-3 mr-1" />
                Email не подтверждён
              </Badge>
            )}
            {user.twoFactorEnabled && (
              <Badge variant="secondary" className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30">
                <Shield className="w-3 h-3 mr-1" />
                2FA
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" />
          Выйти
        </Button>
      </div>

      {/* Email verification banner */}
      {!user.emailVerified && (
        <Card className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-300">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                Подтвердите ваш email
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                Подтверждение email повышает безопасность аккаунта и позволяет восстанавливать пароль.
              </p>
              <Button
                size="sm"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Отправить письмо
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="profile" onValueChange={(v) => v === 'sessions' && loadSessions()}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-1 text-xs sm:text-sm">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Профиль</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-1 text-xs sm:text-sm">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Пароль</span>
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center gap-1 text-xs sm:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">2FA</span>
            {user.twoFactorEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-1 text-xs sm:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Сессии</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-1 text-xs sm:text-sm text-destructive">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Удалить</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="mt-4">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                type="text"
                placeholder="Как к вам обращаться?"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={profileLoading}
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  placeholder="example@mail.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  disabled={profileLoading}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email используется для входа и восстановления пароля
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={profileLoading}>
              {profileLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохраняем...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        {/* Password tab */}
        <TabsContent value="password" className="mt-4">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <Input
                id="currentPassword"
                type={showPasswords ? 'text' : 'password'}
                placeholder="Введите текущий пароль"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                disabled={passwordLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type={showPasswords ? 'text' : 'password'}
                placeholder="Минимум 8 символов"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                disabled={passwordLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Повторите новый пароль"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  disabled={passwordLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Меняем пароль...
                </>
              ) : (
                'Изменить пароль'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              Забыли текущий пароль? Восстановить
            </Link>
          </div>
        </TabsContent>

        {/* 2FA tab */}
        <TabsContent value="2fa" className="mt-4">
          <TwoFactorTab />
        </TabsContent>

        {/* Sessions tab */}
        <TabsContent value="sessions" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Активные сессии</h3>
              <p className="text-xs text-muted-foreground">
                Управляйте входами с разных устройств
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTerminateAllSessions}
              disabled={sessions.length <= 1 || sessionsLoading}
            >
              Завершить все другие
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Нет активных сессий
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">
                      {session.device.includes('Мобильный') ? '📱' :
                       session.device.includes('Планшет') ? '📟' : '💻'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {session.browser} на {session.os}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-xs">
                            Текущая
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.createdAt).toLocaleString('ru-RU')}
                        </span>
                        {session.ip && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {session.ip}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Истекает: {new Date(session.expiresAt).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTerminateSession(session.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        Завершить
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Danger zone */}
        <TabsContent value="danger" className="mt-4">
          <Card className="p-5 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Опасная зона</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Удаление аккаунта необратимо. Все ваши данные, прогресс, достижения
                  и настройки будут стёрты навсегда.
                </p>
              </div>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Ваш пароль</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  placeholder="Введите пароль для подтверждения"
                  value={deleteForm.password}
                  onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                  disabled={deleteLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteConfirm">
                  Подтверждение — введите <strong className="text-destructive">УДАЛИТЬ</strong>
                </Label>
                <Input
                  id="deleteConfirm"
                  type="text"
                  placeholder="УДАЛИТЬ"
                  value={deleteForm.confirm}
                  onChange={(e) => setDeleteForm({ ...deleteForm, confirm: e.target.value })}
                  disabled={deleteLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={deleteLoading || deleteForm.confirm !== 'УДАЛИТЬ'}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Удаляем аккаунт...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить аккаунт навсегда
                  </>
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  )
}
