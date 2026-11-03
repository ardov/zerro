import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Plugin, ViteDevServer, PreviewServer } from 'vite'
import { PageHead } from '../src/2-pages/About/Head'
import {
  articleRoutes,
  siteOrigin,
  resolvePage,
  type ArticleRoute,
} from '../src/6-shared/pageRoutes'

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...['/', ...articleRoutes.map(article => article.path)].map(
    path => '  <url><loc>' + siteOrigin + path + '</loc></url>'
  ),
  '</urlset>\n',
].join('\n')

function pageDocument(html: string, article?: ArticleRoute) {
  const head = renderToStaticMarkup(createElement(PageHead, { article }))
  return html
    .replace(
      '<html lang="ru">',
      '<html lang="' + (article?.language ?? 'ru') + '">'
    )
    .replace(
      '<!-- page-head -->',
      head.replace(/<(title|link|meta)\b/g, '<$1 data-static-head=""')
    )
}

function servePageDocuments(server: ViteDevServer | PreviewServer) {
  const devServer = 'transformIndexHtml' in server ? server : undefined
  const directory = devServer
    ? server.config.root
    : resolve(server.config.root, server.config.build.outDir)

  server.middlewares.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    const pathname = req.url?.split('?')[0] ?? '/'
    if (devServer && pathname === '/sitemap.xml') {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8')
      res.end(sitemap)
      return
    }
    const page = resolvePage(pathname)
    if (page) req.url = devServer ? '/index.html' : page.file
    next()
  })

  // This hook runs after Vite serves static assets, before it handles index.html.
  return () => {
    server.middlewares.use(async (req, res, next) => {
      if (
        req.url === '/index.html' ||
        !req.headers.accept?.includes('text/html')
      )
        return next()
      try {
        const html = await readFile(resolve(directory, '404.html'), 'utf8')
        const page = devServer
          ? await devServer.transformIndexHtml('/404.html', html)
          : html
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(page)
      } catch (error) {
        next(error)
      }
    })
  }
}

export function pageDocuments(): Plugin {
  return {
    name: 'zerro-page-documents',
    enforce: 'post',
    configureServer: servePageDocuments,
    configurePreviewServer: servePageDocuments,
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html
      const path = ctx.originalUrl?.split('?')[0] ?? '/'
      return pageDocument(html, resolvePage(path)?.article)
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const entry = bundle['index.html']
        if (!entry || entry.type !== 'asset') return
        const shell = String(entry.source)
        for (const article of articleRoutes) {
          this.emitFile({
            type: 'asset',
            fileName: article.path.slice(1) + '.html',
            source: pageDocument(shell, article),
          })
        }
        entry.source = pageDocument(shell)
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: sitemap,
        })
      },
    },
  }
}
