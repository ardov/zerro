const DEFAULT_TOKEN = process.env.REACT_APP_TOKEN
const DOMAIN = process.env.REACT_APP_DOMAIN + 'test/?token='

const zenApi = {
  getData(callback, params) {
    const defaultParams = {
      lastSync: 0,
      token: DEFAULT_TOKEN,
      changedObjects: {}
    }
    params = { ...defaultParams, ...params }
    const body = {
      ...{
        currentClientTimestamp: Math.round(Date.now() / 1000),
        lastServerTimestamp: params.lastSync
      },
      ...params.changedObjects
    }

    const options = {
      method: 'POST',
      body: JSON.stringify(body)
    }
    fetch(DOMAIN + params.token, options)
      .then(res => res.json())
      .then(json => {
        callback(json)
      })
      .catch(err => console.warn(err))
  }
}

export default zenApi
