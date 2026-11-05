/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching'
import { resolvePage } from './6-shared/pageRoutes'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[]
}

self.importScripts('favicon-cache-sw.js')
void self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST, {
  urlManipulation: ({ url }) => {
    const page = resolvePage(url.pathname)
    return page ? [new URL(page.file, url)] : []
  },
})
cleanupOutdatedCaches()
