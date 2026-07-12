'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, BookOpen, Type, MessageSquare, GraduationCap,
  Languages, Sparkles, ArrowRight,
} from 'lucide-react'
import { languages } from '@/lib/languages-data'

interface SearchResult {
  type: 'language' | 'letter' | 'phrase' | 'lesson'
  languageId: string
  languageName: string
  languageEmoji: string
  title: string
  subtitle: string
  detail: string
  icon: typeof BookOpen
  tab?: string
}

export function GlobalSearch({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((s) => !s)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        onClose?.()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Search results
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    const found: SearchResult[] = []

    for (const lang of languages) {
      // Language match
      if (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.family.toLowerCase().includes(q) ||
        lang.tagline.toLowerCase().includes(q)
      ) {
        found.push({
          type: 'language',
          languageId: lang.id,
          languageName: lang.name,
          languageEmoji: lang.emoji,
          title: `${lang.name} — ${lang.nativeName}`,
          subtitle: lang.tagline,
          detail: lang.family,
          icon: Languages,
          tab: 'overview',
        })
      }

      // Letters match
      for (const letter of lang.alphabet) {
        if (
          letter.letter.toLowerCase().includes(q) ||
          letter.name.toLowerCase().includes(q) ||
          letter.transcription.toLowerCase().includes(q) ||
          letter.example.toLowerCase().includes(q)
        ) {
          found.push({
            type: 'letter',
            languageId: lang.id,
            languageName: lang.name,
            languageEmoji: lang.emoji,
            title: `${letter.letter} — ${letter.name}`,
            subtitle: `/${letter.transcription}/ · ${letter.example}`,
            detail: letter.exampleTranslation,
            icon: Type,
            tab: 'alphabet',
          })
          if (found.length > 50) break
        }
      }
      if (found.length > 50) break

      // Phrases match
      for (const phrase of lang.phrases) {
        if (
          phrase.original.toLowerCase().includes(q) ||
          phrase.transcription.toLowerCase().includes(q) ||
          phrase.translation.toLowerCase().includes(q)
        ) {
          found.push({
            type: 'phrase',
            languageId: lang.id,
            languageName: lang.name,
            languageEmoji: lang.emoji,
            title: phrase.original,
            subtitle: `/${phrase.transcription}/`,
            detail: phrase.translation,
            icon: MessageSquare,
            tab: 'phrases',
          })
          if (found.length > 80) break
        }
      }
      if (found.length > 80) break

      // Lessons match
      for (const lesson of lang.lessons) {
        if (
          lesson.title.toLowerCase().includes(q) ||
          lesson.description.toLowerCase().includes(q)
        ) {
          found.push({
            type: 'lesson',
            languageId: lang.id,
            languageName: lang.name,
            languageEmoji: lang.emoji,
            title: lesson.title,
            subtitle: lesson.description,
            detail: `${lesson.vocabulary.length} слов · ${lesson.level}`,
            icon: GraduationCap,
            tab: 'lessons',
          })
        }
        // Vocabulary match
        for (const vocab of lesson.vocabulary) {
          if (
            vocab.word.toLowerCase().includes(q) ||
            vocab.transcription.toLowerCase().includes(q) ||
            vocab.translation.toLowerCase().includes(q)
          ) {
            found.push({
              type: 'lesson',
              languageId: lang.id,
              languageName: lang.name,
              languageEmoji: lang.emoji,
              title: vocab.word,
              subtitle: `/${vocab.transcription}/ — ${vocab.translation}`,
              detail: `Урок: ${lesson.title}`,
              icon: BookOpen,
              tab: 'lessons',
            })
          }
        }
      }
    }

    return found.slice(0, 30)
  }, [query])

  const handleResultClick = (result: SearchResult) => {
    // Navigate to language with specific tab
    // We use URL hash to communicate the tab to the page
    router.push(`/#${result.languageId}:${result.tab}`)
    setIsOpen(false)
    setQuery('')
    onClose?.()
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-sm text-muted-foreground w-full max-w-xs"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">Поиск по всем языкам...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Search dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50"
            >
              <div className="bg-card rounded-xl border shadow-2xl overflow-hidden">
                {/* Input */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск букв, фраз, уроков, слов..."
                    className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                  >
                    <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">
                      ESC
                    </kbd>
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {query.length < 2 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Введите минимум 2 символа для поиска
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {['привет', '你好', 'Αθήνα', 'алфавит', 'числа'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="px-3 py-1 rounded-full border text-xs hover:bg-muted"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Ничего не найдено по запросу «{query}»
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {results.length} результатов
                      </div>
                      {results.map((result, i) => {
                        const Icon = result.icon
                        return (
                          <button
                            key={i}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{result.title}</span>
                                <span className="text-base shrink-0">{result.languageEmoji}</span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </div>
                              {result.detail && (
                                <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
                                  {result.detail}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Поиск по 7 языкам · {languages.reduce((s, l) => s + l.alphabet.length + l.phrases.length + l.lessons.length, 0)}+ элементов</span>
                  <span>↵ для выбора</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
