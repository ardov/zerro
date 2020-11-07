import Cookies from 'cookies-js'

const CODE_DATA_KEY = 'auth-code-data'
const TOKEN_KEY = 'token'

const authEndpoint = process.env.REACT_APP_AUTH_ENDPOINT
const tokenEndpoint = process.env.REACT_APP_TOKEN_ENDPOINT
const diffEndpoint = process.env.REACT_APP_DIFF_ENDPOINT

const clientId = process.env.REACT_APP_CLIENT_ID
const clientSecret = process.env.REACT_APP_CLIENT_SECRET
const redirectUri = process.env.REACT_APP_REDIRECT_URI

const ZenApi = { getData, checkCode, getLocalToken, getToken }
export default ZenApi

async function getData(
  token: string,
  // TODO: добавить тип для payload
  payload: any = { serverTimestamp: 0, changed: {} }
) {
  if (!token) throw Error('No token')
  if (token === 'fakeToken')
    return { serverTimestamp: Date.now() / 1000, ...payload.changed }

  const body = {
    currentClientTimestamp: Math.round(Date.now() / 1000),
    lastServerTimestamp: payload.serverTimestamp,
    ...payload.changed,
  }

  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }

  if (!diffEndpoint)
    throw Error('Fill REACT_APP_DIFF_ENDPOINT in your .env file')
  const response = await fetch(diffEndpoint, options)
  const json = await response.json()
  if (json.error) throw Error(JSON.stringify(json.error))

  return json
}

function checkCode() {
  const parsedUrl = new URL(window.location.href)
  const code = parsedUrl.searchParams.get('code')
  const error = parsedUrl.searchParams.get('error')

  if (code) {
    window.localStorage.setItem(CODE_DATA_KEY, code)
    window.close()
  } else if (error) {
    window.alert('Неверный логин или пароль')
    window.close()
  }
}

function getLocalToken() {
  return Cookies.get(TOKEN_KEY) || undefined
}

function getToken() {
  /* if a token exists and hasn't expired, re-use it */
  if (getLocalToken()) return getLocalToken()

  /* if no token exists, request access code first */
  openPopupWindow(
    `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`,
    'ZenMoney Login',
    window,
    480,
    640
  )

  return getAuthorizationCode()
    .then(getAccessTokenData)
    .then(storeAccessTokenData)
    .catch(console.error)

  function getAuthorizationCode() {
    return new Promise((resolve: (s?: string) => void) => {
      function storageEventHandler(e: StorageEvent) {
        if (e.key === CODE_DATA_KEY && e.newValue) {
          window.removeEventListener('storage', storageEventHandler)
          window.localStorage.removeItem(CODE_DATA_KEY)
          resolve(e.newValue)
        }
      }
      window.addEventListener('storage', storageEventHandler)
    })
  }

  function getAccessTokenData(authorizationCode: string) {
    return fetch(`${tokenEndpoint}`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
      headers: { 'Content-Type': 'application/json' },
    }).then(response => response.json())
  }

  function storeAccessTokenData({ access_token, expires_in }: any) {
    if (access_token && access_token !== 'null') {
      Cookies.set(TOKEN_KEY, access_token, { expires: expires_in })
      return access_token
    } else return null
  }

  function openPopupWindow(
    url: string,
    title: string,
    win: Window,
    w: number,
    h: number
  ) {
    var y = win.top.outerHeight / 2 + win.top.screenY - h / 2
    var x = win.top.outerWidth / 2 + win.top.screenX - w / 2
    return win.open(
      url,
      title,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`
    )
  }
}
