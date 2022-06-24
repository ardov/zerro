// ZenMoney endpoints
export const authEndpoint = process.env.REACT_APP_AUTH_ENDPOINT
export const tokenEndpoint = process.env.REACT_APP_TOKEN_ENDPOINT
export const diffEndpoint = process.env.REACT_APP_DIFF_ENDPOINT

// Parameters for ZenMoney requests
export const clientId = process.env.REACT_APP_CLIENT_ID
export const clientSecret = process.env.REACT_APP_CLIENT_SECRET
export const redirectUri = process.env.REACT_APP_REDIRECT_URI

// Tracking parameters
export const sentryDSN = process.env.REACT_APP_SENTRY_DSN
export const ymid = process.env.REACT_APP_YMID
export const gaid = process.env.REACT_APP_GAID

// Info about the app
export const appVersion = process.env.REACT_APP_VERSION
export const appPublicUrl = process.env.PUBLIC_URL
export const isProduction = process.env.NODE_ENV === 'production'

// Database parameters
export const idbBaseName = 'zerro_data'
export const idbStoreName = 'serverData'
