import { i18n } from '@/6-shared/localization'
import type { RootState } from '@/store'
import { fromGraph, graph } from './graph'
import { presentEnvelopes, type TEnvelopeLabels } from './envelopePresentation'
import { presentTags } from './tagPresentation'
import { selectData } from './state'

// Read the shared graph directly here. Namespace modules re-export commands and would create import cycles.

export const getCommandDomainEnvelopes = fromGraph(graph.envelopes)

export function getCommandPresentedEnvelopes(state: RootState) {
  const data = selectData(state)
  const domain = getCommandDomainEnvelopes(state)
  const tags = presentTags(data.tag)
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
