import type { EndpointPreference } from './endpoints'
import { endpoints } from './endpoints'
// Have to use relative path here because of using in worker
import { clientId, clientSecret, redirectUri } from '../../config'

type TAccessToken = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

/** Checks if the auth code is in the URL and puts it in localStorage */
export function processAuthCode() {
  const parsedUrl = new URL(window.location.href)
  const code = parsedUrl.searchParams.get('code')
  const error = parsedUrl.searchParams.get('error')
  if (code) {
    setAuthCode(code)
    window.close()
    return
  }
  if (error) {
    window.alert('Wrong login or password')
    window.close()
    return
  }
}

/**
 * Inits and handles the authorization process
 * @param {string} preference preferred endpoint (.ru or .app)
 * @returns {(string|null)} token
 */
export async function authorize(preference: EndpointPreference) {
  /* Open Zenmoney auth window */
  const authUrl =
    endpoints[preference].auth +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code`
  const popup = openPopupWindow(authUrl, '_blank', 480, 640)
  if (!popup) {
    window.alert('Please allow pop-ups for this site and try signing in again.')
    return null
  }

  /*
    - User logs in to Zenmoney
    - Zenmoney redirects to Zerro with an authorization code in the URL
    - Zerro puts the code in localStorage (`processAuthCode`)
  */

  /* Listen to the authorization code from localStorage and return it */
  const authCode = await waitForAuthCode(popup)
  if (!authCode) return null

  /* Request access token with the received code */
  const tokenUrl = endpoints[preference].token
  const body = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: authCode,
    grant_type: 'authorization_code',
  })
  const accessTokenData: TAccessToken = await fetch(tokenUrl, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  }).then(response => response.json())
  const token = accessTokenData?.access_token
  if (!token) return null

  return token
}

// HELPERS

const AUTH_CODE_KEY = 'auth-code-data'

/** Puts the authorization code in localStorage */
function setAuthCode(code: string) {
  window.localStorage.setItem(AUTH_CODE_KEY, code)
}

/** Listens to the authorization code from localStorage */
function waitForAuthCode(popup: Window) {
  return new Promise((resolve: (s?: string) => void) => {
    function finish(code?: string) {
      window.removeEventListener('storage', storageEventHandler)
      window.clearInterval(closedTimer)
      resolve(code)
    }
    const closedTimer = window.setInterval(() => {
      if (popup.closed) finish()
    }, 500)
    function storageEventHandler(e: StorageEvent) {
      if (e.key !== AUTH_CODE_KEY) return
      if (!e.newValue) return
      window.localStorage.removeItem(AUTH_CODE_KEY)
      finish(e.newValue)
    }
    window.addEventListener('storage', storageEventHandler)
  })
}

/** Opens a popup window in the center of the screen */
function openPopupWindow(url: string, target: string, w: number, h: number) {
  const y = window.outerHeight / 2 + window.screenY - h / 2
  const x = window.outerWidth / 2 + window.screenX - w / 2
  const features = `width=${w}, height=${h}, top=${y}, left=${x}`
  return window.open(url, target, features)
}
