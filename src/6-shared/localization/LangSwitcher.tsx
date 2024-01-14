import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type LangSwitcherProps = {
  [key: string]: ReactNode
}

export const LangSwitcher = (props: LangSwitcherProps) => {
  const { i18n } = useTranslation()

  const getChildForCurrentLang = () => {
    // Return child for current language
    const currentLang = i18n.resolvedLanguage || i18n.language
    if (props[currentLang]) return props[currentLang]

    // Return first fallback language that has a child
    const fallbackLng = i18n.options.fallbackLng
    if (typeof fallbackLng === 'string' && props[fallbackLng]) {
      return props[fallbackLng]
    }
    if (Array.isArray(fallbackLng)) {
      for (const fallback of fallbackLng) {
        if (props[fallback]) return props[fallback]
      }
    }

    // Return null if no child found
    return null
  }

  return <>{getChildForCurrentLang()}</>
}
