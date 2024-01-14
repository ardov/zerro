// ZenMoney endpoints
export const endpoints = {
  ru: {
    auth: 'https://api.zenmoney.ru/oauth2/authorize/',
    token: 'https://api.zenmoney.ru/oauth2/token/',
    diff: 'https://api.zenmoney.ru/v8/diff/',
  },
  app: {
    auth: 'https://api.zenmoney.app/oauth2/authorize/',
    token: 'https://api.zenmoney.app/oauth2/token/',
    diff: 'https://api.zenmoney.app/v8/diff/',
  },
}
export type EndpointPreference = keyof typeof endpoints

// Parameters for ZenMoney requests
export const clientId = import.meta.env.REACT_APP_CLIENT_ID as string
export const clientSecret = import.meta.env.REACT_APP_CLIENT_SECRET as string
export const redirectUri = import.meta.env.REACT_APP_REDIRECT_URI as string

// Tracking parameters
export const sentryDSN = import.meta.env.REACT_APP_SENTRY_DSN as string
export const ymid = import.meta.env.REACT_APP_YMID as string
export const gaid = import.meta.env.REACT_APP_GAID as string

// Info about the app
export const appVersion = APP_VERSION
export const appPublicUrl = import.meta.env.BASE_URL
export const isProduction = import.meta.env.PROD

// Database parameters
export const idbBaseName = 'zerro_data'
export const idbStoreName = 'serverData'

export const fakeToken = 'fake_token'
