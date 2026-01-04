'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { en, fr, Dictionary } from '@/i18n/dictionaries'

type Language = 'EN' | 'FR'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string) => string
  dictionary: Dictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('EN')
  const [dictionary, setDictionary] = useState<Dictionary>(en)

  useEffect(() => {
    // Load persisted language
    const savedLang = localStorage.getItem('app-language') as Language
    if (savedLang && (savedLang === 'EN' || savedLang === 'FR')) {
      setLanguageState(savedLang)
      setDictionary(savedLang === 'FR' ? fr : en)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setDictionary(lang === 'FR' ? fr : en)
    localStorage.setItem('app-language', lang)
  }

  // Helper to get nested values safely
  const t = (path: string): string => {
    const keys = path.split('.')
    let current: any = dictionary

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation missing for key: ${path}`)
        return path
      }
      current = current[key]
    }

    return typeof current === 'string' ? current : path
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dictionary }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
