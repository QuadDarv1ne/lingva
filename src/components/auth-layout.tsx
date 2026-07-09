'use client'

import { motion } from 'framer-motion'
import { Languages as LangIcon } from 'lucide-react'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-amber-50 to-yellow-50 dark:from-rose-950/30 dark:via-amber-950/30 dark:to-yellow-950/30">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl shadow-xl border p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <a href="/" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white">
                  <LangIcon className="w-6 h-6" />
                </div>
              </a>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                {subtitle}
              </p>
            </div>
            {children}
            {footer && (
              <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
