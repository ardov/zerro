import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { preview } from 'vite'

// Test the production output, including files that the initial screen never
// requests. Compare bytes so an HTML fallback cannot masquerade as an asset.
const directory = resolve('dist')
const excluded = new Set([
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'service-worker.js',
])
const files = (
  await readdir(directory, { recursive: true, withFileTypes: true })
)
  .filter(entry => entry.isFile())
  .map(entry =>
    resolve(entry.parentPath, entry.name).slice(directory.length + 1)
  )
  .filter(file => !file.endsWith('.map') && !excluded.has(file))
for (const catalog of ['bank-icons', 'category-icons']) {
  const bundles = files.filter(
    file => file.startsWith(`assets/${catalog}-`) && file.endsWith('.js')
  )
  assert.equal(bundles.length, 1, `One offline bundle for ${catalog}`)
}
const expected = Object.fromEntries(
  await Promise.all(
    files.map(async file => [
      file,
      createHash('sha256')
        .update(await readFile(resolve(directory, file)))
        .digest('hex'),
    ])
  )
)

const server = await preview({
  logLevel: 'silent',
  preview: { host: '127.0.0.1', port: 0, open: false },
})
let browser
try {
  browser = await chromium.launch()
  const origin = server.resolvedUrls.local[0]
  // Two isolated installations, one per theme, with at most two browser pages.
  await Promise.all(
    ['light', 'dark'].map(async colorScheme => {
      const context = await browser.newContext({ colorScheme })
      try {
        const page = await context.newPage()
        page.setDefaultTimeout(60_000)
        await page.goto(origin, { waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => !!navigator.serviceWorker.controller)

        // A new page and disabled HTTP cache ensure the service worker supplies
        // every asset, without relying on what the first screen rendered.
        await page.close()
        await context.setOffline(true)
        const offline = await context.newPage()
        const cdp = await context.newCDPSession(offline)
        await cdp.send('Network.enable')
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
        const response = await offline.goto(`${origin}about/quick-start`, {
          waitUntil: 'load',
        })
        assert(response?.fromServiceWorker(), 'Offline navigation needs the SW')
        await offline.waitForFunction(
          () => document.querySelector('#root')?.childElementCount > 0
        )
        assert.equal(
          await offline.evaluate(() =>
            document.documentElement.classList.contains('dark')
          ),
          colorScheme === 'dark'
        )

        const actual = await offline.evaluate(async paths => {
          const results = {}
          // Keep concurrent requests bounded, like the browser's normal loader.
          for (let start = 0; start < paths.length; start += 12) {
            await Promise.all(
              paths.slice(start, start + 12).map(async path => {
                const response = await fetch(`/${path}`)
                if (!response.ok) throw new Error(`${path}: ${response.status}`)
                const bytes = await response.arrayBuffer()
                const digest = await crypto.subtle.digest('SHA-256', bytes)
                results[path] = Array.from(new Uint8Array(digest), byte =>
                  byte.toString(16).padStart(2, '0')
                ).join('')
                if (/\.(svg|png|jpe?g|webp|avif|gif|ico)$/.test(path)) {
                  const image = new Image()
                  image.src = `/${path}`
                  await image.decode()
                }
                if (/\.(woff2?|ttf|otf)$/.test(path)) {
                  await new FontFace('Offline probe', `url("/${path}")`).load()
                }
              })
            )
          }
          return results
        }, files)
        assert.deepEqual(actual, expected)

        const fonts = await offline.evaluate(async () => {
          const loaded = await Promise.all(
            ['400', '500', '700', 'italic 400'].map(weight =>
              document.fonts.load(
                `${weight} 16px "IBM Plex Sans"`,
                'Бюджет Finance Kč €'
              )
            )
          )
          return loaded.map(
            faces =>
              faces.length > 0 && faces.every(face => face.status === 'loaded')
          )
        })
        assert(fonts.every(Boolean), 'All application font styles load offline')
        const manifestResponse = await offline.goto(
          `${origin}accounts?source=pwa`,
          {
            waitUntil: 'load',
          }
        )
        assert(
          manifestResponse?.fromServiceWorker(),
          'PWA shortcuts work offline'
        )
        console.log(
          `PWA ${colorScheme}: ${files.length} files verified offline; images and fonts decoded; fresh-page navigation passed`
        )
      } finally {
        await context.close()
      }
    })
  )
} finally {
  await browser?.close()
  await new Promise((resolve, reject) =>
    server.httpServer.close(error => (error ? reject(error) : resolve()))
  )
}
