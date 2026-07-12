'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Bot, User, Send, Trash2, Sparkles, Loader2, BookOpen, MessageCircle, HelpCircle } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type ChatMode = 'tutor' | 'native' | 'quiz'

const modes: { id: ChatMode; label: string; description: string; icon: typeof Bot }[] = [
  { id: 'tutor', label: 'Преподаватель', description: 'Объясняет грамматику и слова', icon: BookOpen },
  { id: 'native', label: 'Носитель', description: 'Практика общения на языке', icon: MessageCircle },
  { id: 'quiz', label: 'Экзаменатор', description: 'Задаёт вопросы и проверяет', icon: HelpCircle },
]

const quickPrompts: { [langId: string]: string[] } = {
  russian: [
    'Объясни падежи в русском',
    'Как спрягать глагол «говорить»?',
    'Чем отличаются «тоже» и «также»?',
  ],
  chinese: [
    'Объясни 4 тона путунхуа',
    'Когда используются счётные слова?',
    'Как сказать «Я люблю тебя»?',
  ],
  aramaic: [
    'Покажи основные фразы приветствия',
    'Объясни, как работал арамейский алфавит',
    'На каком арамейском говорил Иисус?',
  ],
  english: [
    'Разница между Present Simple и Continuous',
    'Как использовать Present Perfect?',
    'Неправильные глаголы: топ-10',
  ],
  greek: [
    'Чем отличается η от ι?',
    'Что такое димотика и кафаревуса?',
    'Объясни греческие корни в науке',
  ],
  slavic: [
    'Что такое носовые гласные?',
    'Чем старославянский отличается от церковнославянского?',
    'Объясни букву ѣ (ять)',
  ],
  'church-slavonic': [
    'Что такое титлы в церковнославянском?',
    'Какие надстрочные знаки используются?',
    'Объясни возглас «Господи помилуи»',
  ],
}

export function ChatSection({ language }: { language: Language }) {
  const { recordActivity, incrementChatMessages, updateDailyChallenge } = useProgressStore()
  const [mode, setMode] = useState<ChatMode>('tutor')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Reset messages when mode or language changes
  useEffect(() => {
    const timer = setTimeout(() => setMessages([]), 0)
    return () => clearTimeout(timer)
  }, [mode, language.id])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          languageId: language.id,
          mode,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Ошибка сети')
      }

      const data = await res.json()
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMessage])

      recordActivity()
      incrementChatMessages(language.id)
      updateDailyChallenge('chat', 1)
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `⚠️ Извините, произошла ошибка: ${error instanceof Error ? error.message : 'не удалось получить ответ'}. Попробуйте ещё раз.`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setMessages([])
    try {
      await fetch(
        `/api/chat?languageId=${encodeURIComponent(language.id)}&mode=${mode}`,
        { method: 'DELETE' }
      )
    } catch {
      // ignore
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const prompts = quickPrompts[language.id] || []

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI-преподаватель</h3>
          <Badge variant="secondary" className="ml-auto">z-ai-web-dev-sdk</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Задайте любой вопрос о языке {language.name}. ИИ-преподаватель поможет с грамматикой, лексикой и практикой.
        </p>
      </Card>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        {modes.map((m) => {
          const Icon = m.icon
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-center',
                mode === m.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mx-auto mb-1',
                mode === m.id ? 'text-primary' : 'text-muted-foreground'
              )} />
              <div className="text-xs font-medium">{m.label}</div>
              <div className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">
                {m.description}
              </div>
            </button>
          )
        })}
      </div>

      {/* Chat window */}
      <Card className="overflow-hidden">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="h-[400px] md:h-[500px] overflow-y-auto p-4 space-y-3 bg-muted/20"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Начните разговор</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Спросите о грамматике, лексике или просто поздоровайтесь на {language.name.toLowerCase()} языке.
                </p>
              </div>
              {prompts.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-md">
                  {prompts.map((p, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(p)}
                      className="text-xs"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div className={cn(
                    'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white',
                    msg.role === 'user'
                      ? 'bg-blue-500'
                      : 'bg-gradient-to-br from-primary to-primary/70'
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    'flex-1 max-w-[80%] rounded-2xl p-3',
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-card border shadow-sm'
                  )}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-card border shadow-sm rounded-2xl p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Печатает...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2 items-end bg-background">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Напишите на русском или ${language.name.toLowerCase()}...`}
            className="resize-none min-h-[44px] max-h-32 flex-1"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-11 w-11"
            aria-label="Отправить"
          >
            <Send className="w-4 h-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              onClick={handleClear}
              variant="outline"
              size="icon"
              className="h-11 w-11"
              aria-label="Очистить"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* Hint */}
      <div className="text-xs text-muted-foreground text-center">
        💡 Нажмите Enter для отправки, Shift+Enter — новая строка. Прогресс записывается в дневной стрик.
      </div>
    </div>
  )
}
