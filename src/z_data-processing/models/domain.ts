import { createDomain } from 'effector'
import { attachLogger } from 'effector-logger/attach'

export const dataDomain = createDomain('data')
attachLogger(dataDomain)
