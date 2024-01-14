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
