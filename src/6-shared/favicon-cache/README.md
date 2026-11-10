# Merchant favicons

The [service-worker script](../../../public/favicon-cache-sw.js) caches Google favicon responses after the requesting client confirms image decoding. A unique per-attempt token associates the response with that confirmation and is stripped before network and cache lookup. Late events cannot confirm or evict a replacement image.

The shared cache holds 100 responses, counting sizes separately. Entries expire 30 days after insertion. Reads do not renew them. A miss bypasses the HTTP cache. Without a controlling worker the browser loads images normally.

Settings waits for the worker to acknowledge a reset. Reset clears favicon entries and pending confirmations across tabs. Quota failure purges this cache and suspends writes until worker restart or manual reset. The app precache and financial data have separate storage. [Worker contract tests](worker.test.ts)
