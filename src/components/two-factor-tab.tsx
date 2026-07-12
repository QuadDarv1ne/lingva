'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Shield,
  Loader2,
  Smartphone,
  Key,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface TwoFactorSetup {
  secret: string
  qrCode: string
  otpauthUri: string
  backupCodes: string[]
}

export function TwoFactorTab() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)
  const [verifyToken, setVerifyToken] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [disableToken, setDisableToken] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [regenerateToken, setRegenerateToken] = useState('')
  const [regenerateLoading, setRegenerateLoading] = useState(false)
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const isEnabled = !!user?.twoFactorEnabled

  // Load remaining backup codes count
  const loadRemaining = async () => {
    try {
      const res = await fetch('/api/auth/2fa/backup-codes')
      if (res.ok) {
        const data = await res.json()
        setRemainingCodes(data.remaining)
      }
    } catch {
      // ignore
    }
  }

  const handleSetup = async () => {
    setSetupLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setSetup(data)
      loadRemaining()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось настроить 2FA',
        variant: 'destructive',
      })
    } finally {
      setSetupLoading(false)
    }
  }

  const handleCancelSetup = async () => {
    try {
      await fetch('/api/auth/2fa/setup', { method: 'DELETE' })
      setSetup(null)
      setVerifyToken('')
    } catch {
      // ignore
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verifyToken.length !== 6) {
      toast({ title: 'Введите 6 цифр', variant: 'destructive' })
      return
    }
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken, action: 'enable' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      toast({
        title: '2FA включена! ✅',
        description: 'Сохраните бэкап-коды в безопасном месте',
      })
      setSetup(null)
      setVerifyToken('')
      // Reload user
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Ошибка верификации',
        description: error instanceof Error ? error.message : 'Неверный код',
        variant: 'destructive',
      })
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setDisableLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: disableToken || undefined,
          password: disablePassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      toast({ title: '2FA отключена' })
      setDisableToken('')
      setDisablePassword('')
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отключить',
        variant: 'destructive',
      })
    } finally {
      setDisableLoading(false)
    }
  }

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegenerateLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: regenerateToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')

      setBackupCodes(data.backupCodes)
      setRegenerateToken('')
      setRemainingCodes(8)
      toast({
        title: 'Бэкап-коды обновлены ✅',
        description: 'Старые коды больше недействительны',
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить коды',
        variant: 'destructive',
      })
    } finally {
      setRegenerateLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  // Setup in progress
  if (setup) {
    return (
      <div className="space-y-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                Шаг 1: Отсканируйте QR-код
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                Откройте приложение Google Authenticator (или Authy, 1Password) и добавьте новый аккаунт.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-white rounded-xl border-2">
            <img src={setup.qrCode} alt="QR Code" width={200} height={200} />
          </div>
          <div className="w-full">
            <Label className="text-xs text-muted-foreground">Секретный ключ (для ручного ввода)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={setup.secret}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(setup.secret)}
              >
                {copiedCode === setup.secret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200 mb-2">
                Шаг 2: Сохраните бэкап-коды
              </p>
              <p className="text-amber-800 dark:text-amber-300 mb-3">
                Эти коды позволят войти, если вы потеряете телефон. Каждый код можно использовать один раз.
                Сохраните их в надёжном месте!
              </p>
              <div className="grid grid-cols-2 gap-2">
                {setup.backupCodes.map((code, i) => (
                  <div
                    key={i}
                    className="font-mono text-sm px-3 py-1.5 rounded bg-white dark:bg-card border text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => copyToClipboard(setup.backupCodes.join('\n'))}
              >
                <Copy className="w-3 h-3 mr-1" />
                Копировать все
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Key className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Шаг 3: Подтвердите код</p>
              <p className="text-muted-foreground">
                Введите 6-значный код из приложения для завершения настройки
              </p>
            </div>
          </div>
          <form onSubmit={handleVerify} className="space-y-3">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verifyToken}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setVerifyToken(val)
              }}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
              required
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancelSetup}
                disabled={verifyLoading}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={verifyLoading || verifyToken.length !== 6}
              >
                {verifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Включить 2FA'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    )
  }

  // 2FA enabled view
  if (isEnabled) {
    return (
      <div className="space-y-4">
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-emerald-900 dark:text-emerald-200">
                2FA включена ✅
              </p>
              <p className="text-emerald-800 dark:text-emerald-300 mt-1">
                Ваш аккаунт защищён двухфакторной аутентификацией.
                При входе потребуется код из приложения.
              </p>
            </div>
          </div>
        </Card>

        {/* Backup codes section */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium">Бэкап-коды</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Осталось: {remainingCodes ?? '?'} из 8
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBackupCodes(null)
                setRegenerateToken('')
              }}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Сгенерировать новые
            </Button>
          </div>

          <AnimatePresence>
            {backupCodes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="font-mono text-sm px-3 py-1.5 rounded bg-muted border text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                >
                  {copiedCode === backupCodes.join('\n') ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Копировать все
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!backupCodes && regenerateToken === '' && (
            <form onSubmit={handleRegenerate} className="mt-3 space-y-2">
              <Label htmlFor="regenToken" className="text-xs">
                Для генерации новых кодов введите текущий TOTP код:
              </Label>
              <Input
                id="regenToken"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={regenerateToken}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setRegenerateToken(val)
                }}
                className="text-center text-xl tracking-[0.5em] font-mono"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={regenerateLoading || regenerateToken.length !== 6}
              >
                {regenerateLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : null}
                Подтвердить и сгенерировать
              </Button>
            </form>
          )}
        </Card>

        {/* Disable 2FA */}
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-destructive">Отключить 2FA</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Введите TOTP код или ваш пароль для подтверждения
              </p>
            </div>
          </div>
          <form onSubmit={handleDisable} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="disableToken" className="text-xs">TOTP код</Label>
                <Input
                  id="disableToken"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={disableToken}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setDisableToken(val)
                  }}
                  className="text-center font-mono"
                  disabled={!!disablePassword}
                />
              </div>
              <div>
                <Label htmlFor="disablePassword" className="text-xs">или пароль</Label>
                <Input
                  id="disablePassword"
                  type="password"
                  placeholder="••••••••"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  disabled={!!disableToken}
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={disableLoading || (!disableToken && !disablePassword)}
            >
              {disableLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : null}
              Отключить 2FA
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  // 2FA not enabled — setup prompt
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Защитите свой аккаунт</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Двухфакторная аутентификация добавляет дополнительный уровень безопасности.
          Даже если кто-то узнает ваш пароль, без кода из приложения он не сможет войти.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-xs text-muted-foreground">Google Authenticator</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🔐</div>
            <div className="text-xs text-muted-foreground">Authy / 1Password</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🔑</div>
            <div className="text-xs text-muted-foreground">8 бэкап-кодов</div>
          </div>
        </div>
        <Button onClick={handleSetup} disabled={setupLoading} className="w-full">
          {setupLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Подготовка...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Включить 2FA
            </>
          )}
        </Button>
      </Card>

      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="text-sm space-y-2">
          <div className="font-medium flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Как это работает?
          </div>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs ml-2">
            <li>Включите 2FA — мы сгенерируем QR-код и секретный ключ</li>
            <li>Отсканируйте QR-код в приложении Google Authenticator</li>
            <li>Сохраните 8 бэкап-кодов в надёжном месте</li>
            <li>Введите 6-значный код из приложения для подтверждения</li>
            <li>Готово! При входе потребуется код из приложения</li>
          </ol>
        </div>
      </Card>
    </div>
  )
}
