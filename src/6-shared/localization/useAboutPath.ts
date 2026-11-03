import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { articlePath, resolvePage } from '../pageRoutes'

export function useAboutPath() {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  const language =
    resolvePage(pathname)?.article?.language ??
    i18n.resolvedLanguage ??
    i18n.language
  return articlePath('about', language)
}
