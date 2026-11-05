export const siteOrigin = 'https://zerro.app'
export const articleLanguages = ['ru', 'en'] as const

const articles = {
  about: {
    path: '/about',
    ru: {
      title: 'Что такое Zerro?',
      description: 'Zerro помогает вести личный и семейный бюджет.',
    },
    en: {
      title: 'What is Zerro?',
      description: 'Zerro helps you manage personal and family budget.',
    },
  },
  method: {
    path: '/about/method',
    ru: {
      title: 'Правила ведения личного бюджета | Zerro',
      description: 'Базовые правила при распределении денег',
    },
    en: {
      title: 'Personal Budgeting Rules | Zerro',
      description: 'Basic rules for money allocation',
    },
  },
  quickStart: {
    path: '/about/quick-start',
    ru: {
      title: 'Начало работы | Zerro',
      description: 'Инструкция поможет начать вести бюджет',
    },
    en: {
      title: 'Getting Started | Zerro',
      description: 'This guide will help you start budgeting',
    },
  },
} as const

type ArticleId = keyof typeof articles

export function articlePath(id: ArticleId, language: string) {
  return (language.split('-')[0] === 'en' ? '/en' : '') + articles[id].path
}

export const articleRoutes = (Object.keys(articles) as ArticleId[]).flatMap(
  id =>
    articleLanguages.map(language => ({
      id,
      language,
      ...articles[id][language],
      path: articlePath(id, language),
    }))
)
export type ArticleRoute = (typeof articleRoutes)[number]

const appPaths = [
  '/',
  '/login',
  '/accounts',
  '/budget',
  '/transactions',
  '/stats',
  '/review',
  '/token',
  '/donation',
] as const

export type AppPath = (typeof appPaths)[number]

const shellPaths = new Set<string>(appPaths)

export function resolvePage(pathname: string) {
  const path = pathname.replace(/\/$/, '') || '/'
  const article = articleRoutes.find(route => route.path === path)
  if (article) return { path, file: path + '.html', article }
  if (shellPaths.has(path)) return { path, file: '/index.html' }
}
