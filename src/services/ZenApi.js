const DEFAULT_TOKEN = process.env.REACT_APP_TOKEN
const DOMAIN = process.env.REACT_APP_DOMAIN + 'diff'

const ZenApi = {}
ZenApi.getData = (token, payload = { lastSync: 0, changed: {} }) => {
  const body = {
    currentClientTimestamp: Math.round(Date.now() / 1000),
    lastServerTimestamp: payload.lastSync,
    ...payload.changed
  }

  const options = {
    method: 'POST',
    body: JSON.stringify(body)
  }
  return fetch(`${DOMAIN}/?token=${token}`, options).then(res => res.json())
}

ZenApi.auth = callback => {
  setTimeout(callback(DEFAULT_TOKEN), 500)
}

export default ZenApi
