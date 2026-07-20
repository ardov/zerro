import { i18n } from '6-shared/localization'
import type { RootState } from 'store'
import { getUserSettings } from '../domain/zerro'
import { fromGraph, graph } from './graph'
import { presentEnvelopes, type TEnvelopeLabels } from './envelopePresentation'
import { presentTags } from './tagPresentation'

// Command-side reads. `commands.ts` cannot import the domain namespace modules
// (envelopes/fxRates re-export command creators from commands.ts, which would
// cycle), so these expose the same graph nodes under command-local names. They
// read the committed `state.data.current`, so they hit the shared memo the UI
// already populated rather than recomputing.

export const getCommandDomainEnvelopes = fromGraph(graph.envelopes)
export const getCommandFxRates = fromGraph(graph.fxRatesGetter)

export function getCommandPresentedEnvelopes(state: RootState) {
  const data = state.data.current
  const domain = getCommandDomainEnvelopes(state)
  const tags = presentTags(data.tag, getUserSettings(data))
  return presentEnvelopes(domain, tags, getCommandEnvelopeLabels()).byId
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
