'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mic, MicOff, Volume2, Check, X,
  Activity, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { useProgressStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { speak as speakText } from '@/lib/utils'

interface PracticeWord {
  word: string
  transcription: string
  translation: string
}

export function PronunciationSection({ language }: { language: Language }) {
  const { recordActivity, incrementWrittenCharacters } = useProgressStore()
  const { toast } = useToast()
  const isRtl = language.direction === 'rtl'

  // Build practice words from phrases + vocabulary
  const practiceWords: PracticeWord[] = []
  language.phrases.forEach((p) => {
    practiceWords.push({
      word: p.original,
      transcription: p.transcription,
      translation: p.translation,
    })
  })
  language.lessons.forEach((lesson) => {
    lesson.vocabulary.forEach((v) => {
      practiceWords.push({
        word: v.word,
        transcription: v.transcription,
        translation: v.translation,
      })
    })
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [practiced, setPracticed] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [micSupported] = useState(() => {
    if (typeof navigator === 'undefined') return true
    return !!(navigator.mediaDevices?.getUserMedia)
  })

  const currentWord = practiceWords[currentIndex]

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    speakText(text, language.id, 0.7)
  }, [language.id])

  const startRecording = async () => {
    setMicError(null)
    setAudioUrl(null)
    setHasRecorded(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setHasRecorded(true)
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 10) {
            stopRecording()
            return t
          }
          return t + 1
        })
      }, 1000)
    } catch {
      setMicError('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleNext = () => {
    if (hasRecorded) {
      setPracticed((p) => p + 1)
      incrementWrittenCharacters(language.id)
      recordActivity()
    }
    setAudioUrl(null)
    setHasRecorded(false)
    setRecordingTime(0)
    setCurrentIndex((i) => (i + 1) % practiceWords.length)
  }

  const handlePrev = () => {
    setAudioUrl(null)
    setHasRecorded(false)
    setRecordingTime(0)
    setCurrentIndex((i) => (i - 1 + practiceWords.length) % practiceWords.length)
  }

  const handleSelfAssess = (correct: boolean) => {
    if (correct) {
      toast({ title: 'Отличное произношение! 🎉', description: '+12 XP' })
    } else {
      toast({ title: 'Попробуйте ещё раз', description: 'Слушайте и повторяйте' })
    }
    handleNext()
  }

  if (practiceWords.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Нет слов для практики</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Практика произношения</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Послушайте слово, затем произнесите его в микрофон. Слушайте свою запись и сравнивайте с оригиналом.
        </p>
      </Card>

      {/* Mic not supported */}
      {!micSupported && (
        <Card className="p-6 text-center bg-amber-50 dark:bg-amber-950/30 border-amber-300">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <h3 className="font-semibold mb-1">Микрофон недоступен</h3>
          <p className="text-sm text-muted-foreground">
            Ваш браузер не поддерживает запись аудио. Используйте Chrome, Firefox или Edge.
          </p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{practiced}</div>
          <div className="text-xs text-muted-foreground">отработано</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{currentIndex + 1}</div>
          <div className="text-xs text-muted-foreground">текущее слово</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{practiceWords.length}</div>
          <div className="text-xs text-muted-foreground">всего слов</div>
        </Card>
      </div>

      {/* Current word */}
      <Card className="p-8">
        <div className="text-center mb-6">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Произнесите это слово:
          </div>
          <div
            className="text-5xl font-bold mb-3"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {currentWord.word}
          </div>
          <div className="text-lg text-muted-foreground italic mb-2">
            /{currentWord.transcription}/
          </div>
          <div className="text-sm font-medium border-t pt-2 mt-2">
            {currentWord.translation}
          </div>
        </div>

        {/* Listen to original */}
        <div className="flex justify-center mb-6">
          <Button
            variant="outline"
            onClick={() => speak(currentWord.word)}
            className="flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            Послушать оригинал
          </Button>
        </div>

        {/* Recording controls */}
        {micSupported && (
          <div className="flex flex-col items-center gap-4">
            {/* Record button */}
            {!isRecording && !audioUrl && (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-40 h-40 rounded-full bg-rose-500 hover:bg-rose-600"
              >
                <Mic className="w-12 h-12" />
              </Button>
            )}

            {/* Recording in progress */}
            {isRecording && (
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-40 h-40 rounded-full bg-rose-500 flex items-center justify-center"
                >
                  <Mic className="w-12 h-12 text-white" />
                </motion.div>
                <div className="text-2xl font-mono font-bold text-rose-500">
                  {recordingTime}s
                </div>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  Остановить
                </Button>
              </div>
            )}

            {/* Playback */}
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-4"
              >
                <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                      Запись готова
                    </span>
                  </div>
                  <audio src={audioUrl} controls className="w-full" />
                </Card>

                {/* Self-assessment */}
                <div>
                  <div className="text-sm font-medium text-center mb-3">
                    Сравните с оригиналом. Как ваше произношение?
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => handleSelfAssess(false)}
                      className="flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="w-4 h-4" />
                      Нужно повторить
                    </Button>
                    <Button
                      onClick={() => handleSelfAssess(true)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4" />
                      Хорошо!
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {micError && (
              <div className="text-sm text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {micError}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handlePrev} className="flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <Badge variant="outline" className="text-xs">
          {currentIndex + 1} / {practiceWords.length}
        </Badge>
        <Button variant="outline" onClick={handleNext} className="flex items-center gap-2">
          Далее
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Tips */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="text-sm space-y-2">
          <div className="font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Советы по произношению
          </div>
          <ul className="text-muted-foreground text-xs space-y-1 ml-6 list-disc">
            <li>Слушайте оригинал несколько раз перед записью</li>
            <li>Говорите чётко и не торопитесь</li>
            <li>Сравнивайте свою запись с оригиналом</li>
            <li>Записывайте несколько раз для улучшения</li>
            <li>Обратите внимание на ударения и интонацию</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
