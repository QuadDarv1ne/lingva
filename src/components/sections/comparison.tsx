'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { ArrowRight, GitCompare } from 'lucide-react'
import { Language } from '@/lib/languages-data'
import { cn } from '@/lib/utils'

interface SimilarGroup {
  title: string
  description: string
  pairs: { lang1: string; char1: string; name1: string; lang2: string; char2: string; name2: string; note: string }[]
}

// Pre-defined interesting comparisons
const comparisonGroups: SimilarGroup[] = [
  {
    title: 'Кириллица и греческий',
    description: 'Кириллица создана на основе греческого алфавита — многие буквы внешне похожи, но звучат по-разному',
    pairs: [
      { lang1: 'Греческий', char1: 'Γ', name1: 'Гамма (g)', lang2: 'Русский', char2: 'Г', name2: 'Гэ (g)', note: 'Одинаковое звучание [g]' },
      { lang1: 'Греческий', char1: 'Ρ', name1: 'Ро (r)', lang2: 'Русский', char2: 'Р', name2: 'Эр (r)', note: 'Одинаковое звучание [r]' },
      { lang1: 'Греческий', char1: 'Η', name1: 'Ита (i)', lang2: 'Русский', char2: 'Н', name2: 'Эн (n)', note: '⚠️ Похожи внешне, но разные звуки!' },
      { lang1: 'Греческий', char1: 'Β', name1: 'Вита (v)', lang2: 'Русский', char2: 'В', name2: 'Вэ (v)', note: 'Одинаковое звучание [v]' },
      { lang1: 'Греческий', char1: 'Χ', name1: 'Хи (ch)', lang2: 'Русский', char2: 'Х', name2: 'Ха (kh)', note: 'Похожее придыхательное звучание' },
      { lang1: 'Греческий', char1: 'Π', name1: 'Пи (p)', lang2: 'Русский', char2: 'П', name2: 'Пэ (p)', note: 'Одинаковое звучание [p]' },
    ],
  },
  {
    title: 'Старославянский и церковнославянский',
    description: 'Церковнославянский — прямая эволюция старославянского. Многие буквы идентичны',
    pairs: [
      { lang1: 'Старославянский', char1: 'А', name1: 'азъ', lang2: 'Церковный', char2: 'А', name2: 'а', note: 'Идентичны' },
      { lang1: 'Старославянский', char1: 'Ѧ', name1: 'юсъ малый', lang2: 'Церковный', char2: 'Ѧ', name2: 'ѧ (юсъ)', note: 'Идентичны' },
      { lang1: 'Старославянский', char1: 'Ѫ', name1: 'юсъ большой', lang2: 'Церковный', char2: 'Ѡ', name2: 'ѡ (омега)', note: 'Разные буквы: юс и омега' },
      { lang1: 'Старославянский', char1: 'Ѣ', name1: 'ять', lang2: 'Церковный', char2: 'Ѣ', name2: 'ятъ', note: 'Идентичны' },
    ],
  },
  {
    title: 'Латиница и кириллица',
    description: 'Английский (латиница) и русский (кириллица) — общие «ложные друзья»',
    pairs: [
      { lang1: 'Английский', char1: 'C', name1: 'see (s/k)', lang2: 'Русский', char2: 'С', name2: 'Эс (s)', note: '⚠️ Русская С — это [s], английская C — [s] или [k]' },
      { lang1: 'Английский', char1: 'P', name1: 'pee (p)', lang2: 'Русский', char2: 'Р', name2: 'Эр (r)', note: '⚠️ Похожи внешне, но разные звуки!' },
      { lang1: 'Английский', char1: 'B', name1: 'bee (b)', lang2: 'Русский', char2: 'В', name2: 'Вэ (v)', note: '⚠️ Похожи внешне, но разные звуки!' },
      { lang1: 'Английский', char1: 'H', name1: 'aitch (h)', lang2: 'Русский', char2: 'Н', name2: 'Эн (n)', note: '⚠️ Похожи внешне, но разные звуки!' },
      { lang1: 'Английский', char1: 'X', name1: 'ex (ks)', lang2: 'Русский', char2: 'Х', name2: 'Ха (kh)', note: '⚠️ Похожи внешне, но разные звуки!' },
    ],
  },
  {
    title: 'Арамейский → Арабский/Иврит',
    description: 'Арамейский алфавит — родоначальник арабского и еврейского письма',
    pairs: [
      { lang1: 'Арамейский', char1: 'ܐ', name1: 'Алаф', lang2: 'Иврит', char2: 'א', name2: 'Алеф', note: 'Общий предок — оба от финикийского 𐤀' },
      { lang1: 'Арамейский', char1: 'ܡ', name1: 'Мим', lang2: 'Арабский', char2: 'م', name2: 'Мим', note: 'Почти идентичны' },
      { lang1: 'Арамейский', char1: 'ܠ', name1: 'Ламад', lang2: 'Арабский', char2: 'ل', name2: 'Лам', note: 'Обе буквы от финикийского ламед' },
      { lang1: 'Арамейский', char1: 'ܒ', name1: 'Бет', lang2: 'Иврит', char2: 'ב', name2: 'Бет', note: 'Идентичные названия' },
    ],
  },
  {
    title: 'Греческий → Латиница',
    description: 'Латиница создана на основе греческого через этрусский алфавит',
    pairs: [
      { lang1: 'Греческий', char1: 'Α', name1: 'Альфа (a)', lang2: 'Английский', char2: 'A', name2: 'ay (eɪ)', note: 'Общий предок' },
      { lang1: 'Греческий', char1: 'Β', name1: 'Бета (v)', lang2: 'Английский', char2: 'B', name2: 'bee (b)', note: '⚠️ В древности [b], в новогреческом [v]' },
      { lang1: 'Греческий', char1: 'Ε', name1: 'Эпсилон (e)', lang2: 'Английский', char2: 'E', name2: 'ee (i:)', note: 'Общий предок' },
      { lang1: 'Греческий', char1: 'Τ', name1: 'Тау (t)', lang2: 'Английский', char2: 'T', name2: 'tee (t)', note: 'Одинаковое звучание' },
    ],
  },
]

export function ComparisonSection({ language }: { language: Language }) {
  // Filter comparisons relevant to current language
  const relevant = comparisonGroups.filter((group) =>
    group.pairs.some((p) => p.lang1 === language.name || p.lang2 === language.name)
  )

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Сравнение с другими языками</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Узнайте, как буквы {language.name} связаны с другими алфавитами. Особое внимание уделите «ложным друзьям» — похожим буквам с разным звучанием.
        </p>
      </Card>

      {relevant.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Для этого языка сравнения пока не подготовлены.
        </Card>
      ) : (
        relevant.map((group, gi) => (
          <motion.div
            key={gi}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.1 }}
          >
            <Card className="p-5">
              <h4 className="font-semibold text-lg mb-1">{group.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
              <div className="space-y-2">
                {group.pairs.map((pair, pi) => {
                  const isWarning = pair.note.startsWith('⚠️')
                  return (
                    <motion.div
                      key={pi}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.1 + pi * 0.05 }}
                      className={cn(
                        'p-3 rounded-lg border flex items-center gap-3',
                        isWarning
                          ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
                          : 'border-border bg-muted/30'
                      )}
                    >
                      {/* Lang 1 */}
                      <div className="flex-1 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{pair.lang1}</div>
                        <div className="text-4xl font-bold mb-1">{pair.char1}</div>
                        <div className="text-xs">{pair.name1}</div>
                      </div>
                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      {/* Lang 2 */}
                      <div className="flex-1 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{pair.lang2}</div>
                        <div className="text-4xl font-bold mb-1">{pair.char2}</div>
                        <div className="text-xs">{pair.name2}</div>
                      </div>
                      {/* Note */}
                      <div className="flex-1 text-xs text-muted-foreground hidden sm:block">
                        {pair.note}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  )
}

