import type { MDXComponents } from 'mdx/types'

import { Route, Routes } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Logo } from '6-shared/ui/Logo'
import { LangSwitcher } from '6-shared/localization'
import { ScrollToTop, TextLink } from './Components'
import MethodRu from './pages/MethodRu.mdx'
import MethodEn from './pages/MethodEn.mdx'
import AboutRu from './pages/AboutRu.mdx'
import AboutEn from './pages/AboutEn.mdx'
import QuickStartEn from './pages/QuickStartEn.mdx'
import QuickStartRu from './pages/QuickStartRu.mdx'
import './index.scss'

const components = { a: TextLink } as MDXComponents

const About = () => {
  return (
    <LangSwitcher
      ru={<AboutRu components={components} />}
      en={<AboutEn components={components} />}
    />
  )
}
const Method = () => {
  return (
    <LangSwitcher
      ru={<MethodRu components={components} />}
      en={<MethodEn components={components} />}
    />
  )
}
const QuickStart = () => {
  return (
    <LangSwitcher
      ru={<QuickStartRu components={components} />}
      en={<QuickStartEn components={components} />}
    />
  )
}

export default function Main() {
  return (
    <main className="w-full bg-card">
      <ScrollToTop />
      <Header />
      <div className="flex flex-col items-center px-4 py-16">
        <div className="article w-full min-w-[100px] max-w-[680px]">
          <Routes>
            <Route path="method" element={<Method />} />
            <Route path="quick-start" element={<QuickStart />} />
            <Route index element={<About />} />
          </Routes>
        </div>
      </div>
    </main>
  )
}

const Header = () => {
  return (
    <header className="sticky inset-x-0 top-0 z-[100] flex flex-col items-center p-2">
      <Link to="/">
        <div className="rounded-3xl bg-background px-6 py-2 leading-[0]">
          <Logo fill="var(--primary)" width="100" />
        </div>
      </Link>
    </header>
  )
}
