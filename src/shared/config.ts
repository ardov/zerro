// ZenMoney endpoints
// @ts-ignore
export const authEndpoint = import.meta.env.REACT_APP_AUTH_ENDPOINT
// @ts-ignore
export const tokenEndpoint = import.meta.env.REACT_APP_TOKEN_ENDPOINT
// @ts-ignore
export const diffEndpoint = import.meta.env.REACT_APP_DIFF_ENDPOINT

// Parameters for ZenMoney requests
// @ts-ignore
export const clientId = import.meta.env.REACT_APP_CLIENT_ID
// @ts-ignore
export const clientSecret = import.meta.env.REACT_APP_CLIENT_SECRET
// @ts-ignore
export const redirectUri = import.meta.env.REACT_APP_REDIRECT_URI

// Tracking parameters
// @ts-ignore
export const sentryDSN = import.meta.env.REACT_APP_SENTRY_DSN
// @ts-ignore
export const ymid = import.meta.env.REACT_APP_YMID
// @ts-ignore
export const gaid = import.meta.env.REACT_APP_GAID

// Info about the app
export const appVersion = APP_VERSION
// @ts-ignore
export const appPublicUrl = import.meta.env.BASE_URL
// @ts-ignore
export const isProduction = import.meta.env.PROD

// Database parameters
export const idbBaseName = 'zerro_data'
export const idbStoreName = 'serverData'
