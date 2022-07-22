import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from 'store'
import { getSavingAccounts } from 'models/account'
import { getDebtors } from 'models/debtors'
import { getUserCurrencyCode } from 'models/instrument'
import {
  getEnvelopeId,
  TEnvelopeId,
  TEnvelopeType,
} from 'models/shared/envelopeHelpers'
import { getPopulatedTags } from 'models/tag'
import { ById, DataEntity, TFxCode } from 'shared/types'
import { keys } from 'shared/helpers/keys'

const defaultTagGroup = 'Категории'
const defaultAccountGroup = 'Переводы'
const defaultMerchantGroup = 'Долги'
const defaultPayeeGroup = 'Долги'

export interface IEnvelope {
  // Used to connect with ZM entity
  id: TEnvelopeId
  // Parsed from id
  type: TEnvelopeType
  entityId: string
  // From ZM entity
  name: string
  symbol: string
  color: string | null
  showInBudget: boolean
  // For tags getting this props from ZM entity
  // For other types store in custom storage
  parent: TEnvelopeId | null
  children: TEnvelopeId[]
  // From custom storage
  group: string
  comment: string
  currency: TFxCode
  keepIncome: boolean
  carryNegatives: boolean
}

type TStoredEnvelopeInfo = {
  id: TEnvelopeId
  group?: string
  showInBudget?: boolean
  parent?: TEnvelopeId
  comment?: string
  currency?: TFxCode
  keepIncome?: boolean
  carryNegatives?: boolean
}

const getEnvelopeInfo = () => ({} as ById<TStoredEnvelopeInfo>)

export const getEnvelopes: TSelector<ById<IEnvelope>> = createSelector(
  [
    getDebtors,
    getPopulatedTags,
    getSavingAccounts,
    getEnvelopeInfo,
    getUserCurrencyCode,
  ],
  (debtors, tags, savingAccounts, envelopeInfo, userCurrency) => {
    let result: ById<IEnvelope> = {}

    // Convert tags to envelopes
    Object.values(tags).forEach(tag => {
      const id = getEnvelopeId(DataEntity.Tag, tag.id)
      result[id] = {
        id,
        type: DataEntity.Tag,
        entityId: tag.id,
        name: tag.name,
        symbol: tag.symbol,
        color: tag.colorHEX,
        showInBudget: tag.showOutcome,
        parent: tag.parent ? getEnvelopeId(DataEntity.Tag, tag.parent) : null,
        children: tag.children.map(childId =>
          getEnvelopeId(DataEntity.Tag, childId)
        ),
        group: envelopeInfo[id]?.group || defaultTagGroup,
        comment: envelopeInfo[id]?.comment || '',
        currency: envelopeInfo[id]?.currency || userCurrency,
        keepIncome: envelopeInfo[id]?.keepIncome || false,
        carryNegatives: envelopeInfo[id]?.carryNegatives || false,
      }
    })

    // Convert accounts to envelopes
    savingAccounts.forEach(account => {
      const id = getEnvelopeId(DataEntity.Account, account.id)
      result[id] = {
        id,
        type: DataEntity.Account,
        entityId: account.id,
        name: account.title,
        symbol: '🏦',
        color: null,
        showInBudget: envelopeInfo[id]?.showInBudget || false,
        parent: envelopeInfo[id]?.parent || null,
        children: [],
        group: envelopeInfo[id]?.group || defaultAccountGroup,
        comment: envelopeInfo[id]?.comment || '',
        currency: envelopeInfo[id]?.currency || userCurrency,
        keepIncome: envelopeInfo[id]?.keepIncome || false,
        carryNegatives: envelopeInfo[id]?.carryNegatives || false,
      }
    })

    // Convert debtors to envelopes
    Object.values(debtors).forEach(debtor => {
      if (debtor.merchantId) {
        const id = getEnvelopeId(DataEntity.Merchant, debtor.merchantId)
        result[id] = {
          id,
          type: DataEntity.Merchant,
          entityId: debtor.merchantId,
          name: debtor.name,
          symbol: '👤',
          color: null,
          showInBudget: envelopeInfo[id]?.showInBudget || false,
          parent: envelopeInfo[id]?.parent || null,
          children: [],
          group: envelopeInfo[id]?.group || defaultMerchantGroup,
          comment: envelopeInfo[id]?.comment || '',
          currency: envelopeInfo[id]?.currency || userCurrency,
          keepIncome: envelopeInfo[id]?.keepIncome || false,
          carryNegatives: envelopeInfo[id]?.carryNegatives || false,
        }
      } else {
        // It's payee (old format that depends only on payee names)
        const id = getEnvelopeId('payee', debtor.id)
        result[id] = {
          id,
          type: 'payee',
          entityId: debtor.id,
          name: debtor.name,
          symbol: '🌚',
          color: null,
          showInBudget: false,
          parent: null,
          children: [],
          group: envelopeInfo[id]?.group || defaultPayeeGroup,
          comment: '',
          currency: userCurrency,
          keepIncome: false,
          carryNegatives: false,
        }
      }
    })

    // Fix nesting issues (only 2 levels are allowed)
    keys(result).forEach(id => {
      const envelope = result[id]
      if (!envelope.parent) return
      envelope.parent = getParent(envelope)

      // Use recursion to get topmost parent id
      function getParent(envelope: IEnvelope): IEnvelope['id'] {
        if (!envelope.parent) return envelope.id
        else return getParent(result[envelope.parent])
      }
    })

    return result
  }
)
