/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite/client" />
declare const APP_VERSION: string
/** When the build ran, as an ISO string. */
declare const APP_BUILD_DATE: string
/** The built commit, shortened; `unknown` when neither Vercel nor git says. */
declare const APP_BUILD_COMMIT: string
