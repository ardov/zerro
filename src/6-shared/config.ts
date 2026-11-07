// Parameters for Zenmoney requests
export const clientId = import.meta.env.REACT_APP_CLIENT_ID as string
export const clientSecret = import.meta.env.REACT_APP_CLIENT_SECRET as string
export const redirectUri = import.meta.env.REACT_APP_REDIRECT_URI as string

// Tracking parameters
export const sentryDSN = import.meta.env.REACT_APP_SENTRY_DSN as string
// The Yandex Metrica counter is initialized outside the application bundle.
// Keep its deployment configuration, but do not send product events/reachGoal.
export const ymid = import.meta.env.REACT_APP_YMID as string
export const gaid = import.meta.env.REACT_APP_GAID as string

function readBuildMeta(name: string) {
  return globalThis.document?.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  )?.content
}

export const appVersion = readBuildMeta('zerro-version') ?? 'unknown'
export const buildDate = readBuildMeta('zerro-build-date')
export const appRelease = readBuildMeta('zerro-release') ?? 'unknown'
export const isProduction = import.meta.env.PROD

// Database parameters
export const idbBaseName = 'zerro_data'
