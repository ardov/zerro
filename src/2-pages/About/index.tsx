import type { MDXComponents } from 'mdx/types'
import { Link } from 'react-router-dom'
import { Logo } from '@/6-shared/ui/Logo'
import { articlePath, type ArticleRoute } from '@/6-shared/pageRoutes'
import { TextLink } from './Components'
import MethodRu from './pages/MethodRu.mdx'
import MethodEn from './pages/MethodEn.mdx'
import AboutRu from './pages/AboutRu.mdx'
import AboutEn from './pages/AboutEn.mdx'
import QuickStartEn from './pages/QuickStartEn.mdx'
import QuickStartRu from './pages/QuickStartRu.mdx'
import './index.css'

const components = { a: TextLink } as MDXComponents
const translations = {
  about: { ru: AboutRu, en: AboutEn },
  method: { ru: MethodRu, en: MethodEn },
  quickStart: { ru: QuickStartRu, en: QuickStartEn },
}

export default function About({ id, language }: ArticleRoute) {
  const Article = translations[id][language]
  const otherLanguage = language === 'ru' ? 'en' : 'ru'
  return (
    <div className="w-full" lang={language}>
      <header className="sticky inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 p-2">
        <Link
          to="/"
          aria-label="Zerro"
          className="rounded-3xl bg-ui-card px-6 py-2 leading-[0]"
        >
          <Logo fill="var(--color-ui-primary)" width="100" />
        </Link>
        <Link
          to={articlePath(id, otherLanguage)}
          lang={otherLanguage}
          hrefLang={otherLanguage}
          className="rounded-3xl bg-ui-card px-4 py-2 text-ui-link"
        >
          {otherLanguage === 'en' ? 'English' : 'Русский'}
        </Link>
      </header>
      <div className="flex flex-col items-center px-4 py-16">
        <article className="article w-full min-w-[100px] max-w-[680px]">
          <Article components={components} />
        </article>
      </div>
    </div>
  )
}
