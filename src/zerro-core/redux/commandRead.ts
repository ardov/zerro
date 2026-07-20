import { i18n } from '6-shared/localization'
import type { RootState } from 'store'
import { createZerroSession } from '../application/session'
import { buildFxRatesGetter, getUserSettings } from '../domain/zerro'
import { presentEnvelopes, type TEnvelopeLabels } from './envelopePresentation'
import { presentTags } from './tagPresentation'

const readContext = { now: () => Date.now(), uuid: () => '' }

export function getCommandDomainEnvelopes(state: RootState) {
  return createZerroSession(state.data.current, readContext).envelopes.getAll()
}

export function getCommandPresentedEnvelopes(state: RootState) {
  const data = state.data.current
  const domain = getCommandDomainEnvelopes(state)
  const tags = presentTags(data.tag, getUserSettings(data))
  return presentEnvelopes(domain, tags, getCommandEnvelopeLabels()).byId
}

export function getCommandFxRates(state: RootState) {
  const session = createZerroSession(state.data.current, readContext)
  return buildFxRatesGetter({
    rates: session.fx.getRates(),
    currentRates: session.fx.getCurrentRates(),
  })
}

let labelsCacheLanguage: string | undefined
let labelsCache: TEnvelopeLabels | undefined

export function getCommandEnvelopeLabels(): TEnvelopeLabels {
  if (labelsCache && labelsCacheLanguage === i18n.language) return labelsCache
  labelsCacheLanguage = i18n.language
  labelsCache = {
    defaultTagGroup: i18n.t('defaultTagGroup', { ns: 'common' }),
    defaultAccountGroup: i18n.t('defaultAccountGroup', { ns: 'common' }),
    defaultMerchantGroup: i18n.t('defaultMerchantGroup', { ns: 'common' }),
    defaultPayeeGroup: i18n.t('defaultPayeeGroup', { ns: 'common' }),
  }
  return labelsCache
}
