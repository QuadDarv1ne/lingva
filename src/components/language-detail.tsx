'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Type, MessageSquare, GraduationCap, Layers, Trophy, Brush, Link2, Sparkles, Bot, Keyboard, GitCompare, Wand2, Shuffle, Mic, FileText } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { OverviewSection } from './sections/overview'
import { AlphabetSection } from './sections/alphabet'
import { PhrasesSection } from './sections/phrases'
import { LessonsSection } from './sections/lessons'
import { FlashcardsSection } from './sections/flashcards'
import { QuizSection } from './sections/quiz'
import { WritingSection } from './sections/writing'
import { MatchingGame } from './sections/matching-game'
import { CultureSection } from './sections/culture'
import { ChatSection } from './sections/chat'
import { TypingSection } from './sections/typing'
import { ComparisonSection } from './sections/comparison'
import { WordScramble } from './mini-games/word-scramble'
import { FillInTheBlank } from './mini-games/fill-blank'
import { ReadingSection } from './sections/reading'
import { PronunciationSection } from './sections/pronunciation'

interface LanguageDetailProps {
  language: Language
  onBack: () => void
}

export function LanguageDetail({ language, onBack }: LanguageDetailProps) {
  const [tab, setTab] = useState('overview')

  return (
    <div className="min-h-screen pb-12">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Назад">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl">{language.emoji}</span>
            <div className="min-w-0">
              <div className="font-semibold truncate">{language.nativeName}</div>
              <div className="text-xs text-muted-foreground truncate">{language.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="overflow-x-auto pb-2 -mx-4 px-4">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Обзор</span>
                </TabsTrigger>
                <TabsTrigger value="alphabet" className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline">Алфавит</span>
                </TabsTrigger>
                <TabsTrigger value="phrases" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Фразы</span>
                </TabsTrigger>
                <TabsTrigger value="lessons" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Уроки</span>
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Карточки</span>
                </TabsTrigger>
                <TabsTrigger value="writing" className="flex items-center gap-2">
                  <Brush className="w-4 h-4" />
                  <span className="hidden sm:inline">Письмо</span>
                </TabsTrigger>
                <TabsTrigger value="typing" className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Печать</span>
                </TabsTrigger>
                <TabsTrigger value="matching" className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Игра</span>
                </TabsTrigger>
                <TabsTrigger value="scramble" className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4" />
                  <span className="hidden sm:inline">Анаграмма</span>
                </TabsTrigger>
                <TabsTrigger value="fillblank" className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Пропуски</span>
                </TabsTrigger>
                <TabsTrigger value="reading" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Чтение</span>
                </TabsTrigger>
                <TabsTrigger value="pronunciation" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">Произн.</span>
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  <span className="hidden sm:inline">Сравн.</span>
                </TabsTrigger>
                <TabsTrigger value="culture" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Культура</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">AI-чат</span>
                </TabsTrigger>
                <TabsTrigger value="quiz" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">Тест</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-6">
              <OverviewSection language={language} />
            </TabsContent>
            <TabsContent value="alphabet" className="mt-6">
              <AlphabetSection language={language} />
            </TabsContent>
            <TabsContent value="phrases" className="mt-6">
              <PhrasesSection language={language} />
            </TabsContent>
            <TabsContent value="lessons" className="mt-6">
              <LessonsSection language={language} />
            </TabsContent>
            <TabsContent value="flashcards" className="mt-6">
              <FlashcardsSection language={language} />
            </TabsContent>
            <TabsContent value="writing" className="mt-6">
              <WritingSection language={language} />
            </TabsContent>
            <TabsContent value="typing" className="mt-6">
              <TypingSection language={language} />
            </TabsContent>
            <TabsContent value="matching" className="mt-6">
              <MatchingGame language={language} />
            </TabsContent>
            <TabsContent value="scramble" className="mt-6">
              <WordScramble language={language} />
            </TabsContent>
            <TabsContent value="fillblank" className="mt-6">
              <FillInTheBlank language={language} />
            </TabsContent>
            <TabsContent value="reading" className="mt-6">
              <ReadingSection language={language} />
            </TabsContent>
            <TabsContent value="pronunciation" className="mt-6">
              <PronunciationSection language={language} />
            </TabsContent>
            <TabsContent value="comparison" className="mt-6">
              <ComparisonSection language={language} />
            </TabsContent>
            <TabsContent value="culture" className="mt-6">
              <CultureSection language={language} />
            </TabsContent>
            <TabsContent value="chat" className="mt-6">
              <ChatSection language={language} />
            </TabsContent>
            <TabsContent value="quiz" className="mt-6">
              <QuizSection language={language} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
