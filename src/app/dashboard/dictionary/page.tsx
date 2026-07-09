'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BookOpen, Search, Trash2, Volume2, Plus, Loader2, X,
  Clock, CheckCircle2, BookMarked, Brain,
} from 'lucide-react'
import Link from 'next/link'
import { useProgressStore, PersonalWord } from '@/lib/store'
import { languages } from '@/lib/languages-data'
import { useToast } from '@/hooks/use-toast'
import { cn, speak as speakText } from '@/lib/utils'

export default function DictionaryPage() {
  const { personalDictionary, addWord, removeWord, reviewWord } = useProgressStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filterLang, setFilterLang] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWord, setNewWord] = useState({
    languageId: 'russian',
    word: '',
    transcription: '',
    translation: '',
  })

  const speak = (text: string, langId: string) => speakText(text, langId)

  const filteredWords = useMemo(() => {
    return personalDictionary.filter((w) => {
      if (filterLang !== 'all' && w.languageId !== filterLang) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          w.word.toLowerCase().includes(q) ||
          w.translation.toLowerCase().includes(q) ||
          w.transcription.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [personalDictionary, search, filterLang])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWord.word.trim() || !newWord.translation.trim()) {
      toast({ title: 'Заполните слово и перевод', variant: 'destructive' })
      return
    }
    addWord({
      languageId: newWord.languageId,
      word: newWord.word.trim(),
      transcription: newWord.transcription.trim(),
      translation: newWord.translation.trim(),
      tags: [],
    })
    toast({ title: 'Слово добавлено ✅' })
    setNewWord({ languageId: newWord.languageId, word: '', transcription: '', translation: '' })
    setShowAddForm(false)
  }

  const handleRemove = (id: string, word: string) => {
    if (!confirm(`Удалить слово «${word}»?`)) return
    removeWord(id)
    toast({ title: 'Слово удалено' })
  }

  const handleReview = (id: string) => {
    reviewWord(id)
    toast({ title: 'Отмечено как повторённое 📖' })
  }

  // Group by language
  const grouped = useMemo(() => {
    const map: { [langId: string]: PersonalWord[] } = {}
    filteredWords.forEach((w) => {
      if (!map[w.languageId]) map[w.languageId] = []
      map[w.languageId].push(w)
    })
    return map
  }, [filteredWords])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Словарик</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {personalDictionary.length} слов
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {personalDictionary.length > 0 && (
              <Link href="/dashboard/practice">
                <Button variant="outline" size="sm">
                  <Brain className="w-4 h-4 mr-1" />
                  Практика
                </Button>
              </Link>
            )}
            <Button onClick={() => setShowAddForm((s) => !s)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Добавить
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">← Назад</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Новое слово</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleAdd} className="space-y-3">
                  <div>
                    <Label htmlFor="lang">Язык</Label>
                    <select
                      id="lang"
                      value={newWord.languageId}
                      onChange={(e) => setNewWord({ ...newWord, languageId: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                    >
                      {languages.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} — {l.nativeName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="word">Слово</Label>
                      <Input
                        id="word"
                        value={newWord.word}
                        onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                        placeholder="Например, привет"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="transcription">Транскрипция</Label>
                      <Input
                        id="transcription"
                        value={newWord.transcription}
                        onChange={(e) => setNewWord({ ...newWord, transcription: e.target.value })}
                        placeholder="[privet]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="translation">Перевод</Label>
                    <Input
                      id="translation"
                      value={newWord.translation}
                      onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                      placeholder="Приветствие"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Добавить в словарик
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and filter */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск слов..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-background"
            >
              <option value="all">Все языки</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Words grouped by language */}
        {filteredWords.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">
              {personalDictionary.length === 0 ? 'Словарик пуст' : 'Ничего не найдено'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {personalDictionary.length === 0
                ? 'Добавляйте сюда слова, которые хотите запомнить, для повторения'
                : 'Попробуйте изменить поиск или фильтр'}
            </p>
            {personalDictionary.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить первое слово
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([langId, words]) => {
              const lang = languages.find((l) => l.id === langId)
              if (!lang) return null
              const isRtl = lang.direction === 'rtl'
              return (
                <div key={langId}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{lang.emoji}</span>
                    <h3 className="font-semibold">{lang.name}</h3>
                    <Badge variant="secondary">{words.length}</Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {words.map((w, i) => (
                      <motion.div
                        key={w.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="p-4 group hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-xl font-medium truncate"
                                dir={isRtl ? 'rtl' : 'ltr'}
                              >
                                {w.word}
                              </div>
                              {w.transcription && (
                                <div className="text-xs text-muted-foreground italic">
                                  [{w.transcription}]
                                </div>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0 opacity-60 group-hover:opacity-100"
                              onClick={() => speak(w.word, w.languageId)}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="text-sm border-t pt-2 mb-2">
                            {w.translation}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {w.reviewed > 0 ? (
                                <Badge variant="outline" className="text-emerald-600 text-[10px]">
                                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                  {w.reviewed}x
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                                  Новое
                                </Badge>
                              )}
                              <span>{new Date(w.addedAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => handleReview(w.id)}
                              >
                                Повторил
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemove(w.id, w.word)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
