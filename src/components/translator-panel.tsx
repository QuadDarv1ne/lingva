'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Copy, Languages, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

const languageOptions = [
  { code: 'auto', label: 'Авто', native: 'Auto detect' },
  { code: 'ru', label: 'Русский', native: 'Русский' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'de', label: 'Deutsch', native: 'Deutsch' },
  { code: 'fr', label: 'Français', native: 'Français' },
  { code: 'es', label: 'Español', native: 'Español' },
  { code: 'it', label: 'Italiano', native: 'Italiano' },
  { code: 'zh', label: '中文', native: '中文' },
  { code: 'ja', label: '日本語', native: '日本語' },
  { code: 'ar', label: 'العربية', native: 'العربية' },
] as const

const defaultSource = 'auto'
const defaultTarget = 'ru'

async function translateText(text: string, source: string, target: string) {
  const normalized = text.trim()
  if (!normalized) {
    return { translated: '', detected: source === 'auto' ? 'auto' : source }
  }

  const pair = source === 'auto' ? `auto|${target}` : `${source}|${target}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(normalized)}&langpair=${encodeURIComponent(pair)}`

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Сервис перевода временно недоступен')
  }

  const data = await response.json()
  const translated = data?.responseData?.translatedText || data?.matches?.[0]?.translation || ''
  const detected = data?.responseData?.detectedLanguage || source

  if (!translated) {
    throw new Error('Не удалось получить перевод')
  }

  return { translated, detected }
}

export function TranslatorPanel() {
  const [input, setInput] = useState('Hello world')
  const [sourceLang, setSourceLang] = useState(defaultSource)
  const [targetLang, setTargetLang] = useState(defaultTarget)
  const [result, setResult] = useState('Привет, мир')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)

  const sourceLabel = useMemo(
    () => languageOptions.find((item) => item.code === sourceLang)?.label ?? 'Авто',
    [sourceLang]
  )

  const targetLabel = useMemo(
    () => languageOptions.find((item) => item.code === targetLang)?.label ?? 'Русский',
    [targetLang]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runTranslation(false)
    }, 450)

    return () => window.clearTimeout(timer)
  }, [input, sourceLang, targetLang])

  const runTranslation = async (manual = true) => {
    const text = input.trim()
    if (!text) {
      setResult('')
      setError(null)
      setDetectedLanguage(null)
      return
    }

    if (manual) {
      setLoading(true)
    }

    try {
      setError(null)
      const data = await translateText(text, sourceLang, targetLang)
      setResult(data.translated)
      if (sourceLang === 'auto' && data.detected !== 'auto') {
        setDetectedLanguage(data.detected)
      } else {
        setDetectedLanguage(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка перевода')
      setResult('')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void runTranslation(true)
    }
  }

  const copyResult = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
  }

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Инструмент</div>
            <h3 className="text-xl font-bold">Переводчик</h3>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Auto detect
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 rounded-xl border bg-background px-3 py-2 shadow-sm">
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">С языка</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mx-auto h-10 w-10 rounded-full"
            onClick={swapLanguages}
            aria-label="Поменять языки"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 rounded-xl border bg-background px-3 py-2 shadow-sm">
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">На язык</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            >
              {languageOptions
                .filter((language) => language.code !== 'auto')
                .map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{sourceLabel}</span>
              {detectedLanguage && sourceLang === 'auto' && (
                <span>Определён: {languageOptions.find((item) => item.code === detectedLanguage)?.label ?? detectedLanguage}</span>
              )}
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              placeholder="Введите текст для перевода..."
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <Button onClick={() => void runTranslation(true)} disabled={loading || !input.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Переводим...
                  </>
                ) : (
                  'Перевести'
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput('')}>
                Очистить
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{targetLabel}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyResult} disabled={!result} aria-label="Копировать результат">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-[160px] rounded-xl border bg-muted/30 p-4 text-sm leading-7 whitespace-pre-wrap">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : result ? (
                result
              ) : (
                <span className="text-muted-foreground">Результат перевода появится здесь</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
