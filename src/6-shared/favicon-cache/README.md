# Merchant favicon cache

The generated service worker imports `public/favicon-cache-sw.js`. It intercepts
only Google favicon image requests made by the shared `Favicon` component.
The component reports successful decoding or failure; opaque responses are saved
only after a matching client reports `load` for the exact image attempt. Each
attempt has a unique `__zerro_request` token in its URL; the worker strips this
token before fetching Google or forming the persistent cache key. Late events
cannot confirm or evict a replacement request after reset or timeout. Cached
responses retain their attempt record until decoding finishes too; failure can
remove only the cache entry actually served to that attempt. Unconfirmed responses are held for
at most 15 seconds, with at most 100 pending requests. Without a controlling
worker, images continue to use the browser's normal HTTP cache.

`zerro-favicons-v1` holds at most 100 responses (48px and 32px variants count
separately). Entries expire 30 days after insertion; reads do not extend expiry.
Expired entries are removed on access, without serving them stale. At capacity,
the oldest inserted entries are evicted. Misses bypass the HTTP cache so expiry
and manual reset can refresh the image. Failed requests are not persisted.

Cache writes and reset are serialized. Reset discards pending confirmations and
responses from requests started before it. It clears only the favicon namespace,
never the application precache or financial data. Existing displayed images stay
visible; subsequent requests repopulate the cache. All tabs share this cache.
The settings action waits for the worker's acknowledgement and reports failure
if it cannot confirm reset.

Browsers may evict storage earlier. Opaque response quota accounting can greatly
exceed the image's byte size. On quota failure, the worker purges only this cache
and stops writes until worker restart or manual reset. Image loading continues.
The message names and cache name are an internal protocol shared with `index.ts`;
`worker.test.ts` exercises the shipped script, including concurrency and reset.
