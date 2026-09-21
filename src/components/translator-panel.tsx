'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Clock3, Copy, Languages, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type TranslationHistoryEntry = {
  id: string
  input: string
  output: string
  sourceLang: string
  targetLang: string
  detectedLanguage?: string | null
  createdAt: string
}

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
const HISTORY_KEY = 'lingva-translator-history'

async function translateText(text: string, source: string, target: string) {
  const normalized = text.trim()
  if (!normalized) {
    return { translated: '', detected: source === 'auto' ? 'auto' : source }
  }

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      text: normalized,
      sourceLang: source,
      targetLang: target,
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Сервис перевода временно недоступен' }))
    throw new Error(payload.error || 'Сервис перевода временно недоступен')
  }

  const data = await response.json()
  const translated = data?.translatedText || ''
  const detected = data?.detectedLanguage ?? source

  if (!translated) {
    throw new Error('Не удалось получить перевод')
  }

  return { translated, detected }
}

export function TranslatorPanel() {
  const { toast } = useToast()
  const [input, setInput] = useState('Hello world')
  const [sourceLang, setSourceLang] = useState(defaultSource)
  const [targetLang, setTargetLang] = useState(defaultTarget)
  const [result, setResult] = useState('Привет, мир')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [history, setHistory] = useState<TranslationHistoryEntry[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as TranslationHistoryEntry[]
      if (Array.isArray(parsed)) {
        setHistory(parsed)
      }
    } catch {
      // ignore invalid storage
    }
  }, [])

  useEffect(() => {
    if (!history.length) {
      window.localStorage.removeItem(HISTORY_KEY)
      return
    }

    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 6)))
  }, [history])

  const sourceLabel = useMemo(
    () => languageOptions.find((item) => item.code === sourceLang)?.label ?? 'Авто',
    [sourceLang]
  )

  const targetLabel = useMemo(
    () => languageOptions.find((item) => item.code === targetLang)?.label ?? 'Русский',
    [targetLang]
  )

  const saveHistoryEntry = useCallback(
    (nextInput: string, nextOutput: string) => {
      const entry: TranslationHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        input: nextInput,
        output: nextOutput,
        sourceLang,
        targetLang,
        detectedLanguage,
        createdAt: new Date().toISOString(),
      }

      setHistory((previous) => [
        entry,
        ...previous.filter((item) => item.input !== nextInput || item.output !== nextOutput),
      ].slice(0, 6))
    },
    [detectedLanguage, sourceLang, targetLang]
  )

  const runTranslation = useCallback(
    async (manual = true) => {
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

        saveHistoryEntry(text, data.translated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка перевода')
        setResult('')
      } finally {
        setLoading(false)
      }
    },
    [input, saveHistoryEntry, sourceLang, targetLang]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runTranslation(false)
    }, 450)

    return () => window.clearTimeout(timer)
  }, [input, runTranslation, sourceLang, targetLang])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void runTranslation(true)
    }
  }

  const copyResult = async () => {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result)
      toast({
        title: 'Готово',
        description: 'Перевод скопирован в буфер обмена',
      })
    } catch {
      toast({
        title: 'Ошибка копирования',
        description: 'Не удалось скопировать текст',
        variant: 'destructive',
      })
    }
  }

  const clearText = () => {
    setInput('')
    setResult('')
    setError(null)
    setDetectedLanguage(null)
  }

  const clearHistory = () => {
    setHistory([])
    toast({ title: 'История очищена', description: 'Недавние переводы удалены' })
  }

  const applyHistoryEntry = (entry: TranslationHistoryEntry) => {
    setInput(entry.input)
    setSourceLang(entry.sourceLang)
    setTargetLang(entry.targetLang)
    setResult(entry.output)
    setDetectedLanguage(entry.detectedLanguage ?? null)
  }

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/40 shadow-lg shadow-primary/5">
      <div className="border-b bg-muted/30 px-5 py-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-amber-500 text-white shadow-md">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Инструмент</p>
              <h3 className="text-xl font-bold">Переводчик</h3>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Auto detect
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 rounded-2xl border bg-background/70 px-3 py-2.5 shadow-sm">
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
              className="mx-auto h-11 w-11 rounded-full shadow-sm"
              onClick={swapLanguages}
              aria-label="Поменять языки"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 rounded-2xl border bg-background/70 px-3 py-2.5 shadow-sm">
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

          <div className="rounded-2xl border bg-background/70 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{sourceLabel}</span>
              {detectedLanguage && sourceLang === 'auto' && (
                <span>Определён: {languageOptions.find((item) => item.code === detectedLanguage)?.label ?? detectedLanguage}</span>
              )}
            </div>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={7}
              placeholder="Введите текст для перевода..."
              className="min-h-[170px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button onClick={() => void runTranslation(true)} disabled={loading || !input.trim()} className="min-w-[150px]">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Переводим...
                  </>
                ) : (
                  'Перевести'
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={clearText} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Очистить
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-gradient-to-br from-rose-500/5 via-background to-amber-500/5 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{targetLabel}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void copyResult()} disabled={!result} aria-label="Копировать результат">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-[170px] rounded-xl border bg-background/80 p-4 text-sm leading-7 whitespace-pre-wrap shadow-inner">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : result ? (
                result
              ) : (
                <span className="text-muted-foreground">Результат перевода появится здесь</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-background/70 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">История</span>
              </div>

              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="h-8 px-2 text-xs">
                  Очистить
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет сохранённых переводов.</p>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => applyHistoryEntry(entry)}
                    className="w-full rounded-xl border bg-muted/30 p-2 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <span>{languageOptions.find((item) => item.code === entry.sourceLang)?.label ?? entry.sourceLang}</span>
                      <span>→</span>
                      <span>{languageOptions.find((item) => item.code === entry.targetLang)?.label ?? entry.targetLang}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground">{entry.input}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{entry.output}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
