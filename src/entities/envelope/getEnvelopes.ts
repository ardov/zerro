import { createSelector } from '@reduxjs/toolkit'
import {
  ById,
  DataEntity,
  IAccount,
  TEnvelopeId,
  TEnvelopeType,
  TFxCode,
} from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { TSelector } from '@store'
import { getSavingAccounts } from '@entities/account'
import { getDebtors, TDebtor } from '@entities/debtors'
import { getUserCurrencyCode } from '@entities/instrument'
import { getPopulatedTags, TTagPopulated } from '@entities/tag'
import { getEnvelopeId } from './helpers'
import { getEnvelopeMeta, TEnvelopeMeta, envelopeVisibility } from './metaData'

const defaultTagGroup = 'Категории'
const defaultAccountGroup = 'Переводы'
const defaultMerchantGroup = 'Долги'
const defaultPayeeGroup = 'Долги'

export interface IEnvelope {
  id: TEnvelopeId
  type: TEnvelopeType
  entityId: string // Used to connect with ZM entity

  name: string // From ZM entity
  symbol: string // From ZM entity
  color: string | null
  visibility: envelopeVisibility
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

export const getEnvelopes: TSelector<ById<IEnvelope>> = createSelector(
  [
    getDebtors,
    getPopulatedTags,
    getSavingAccounts,
    getEnvelopeMeta,
    getUserCurrencyCode,
  ],
  (debtors, tags, savingAccounts, envelopeMeta, userCurrency) => {
    let result: ById<IEnvelope> = {}

    // Convert tags to envelopes
    Object.values(tags).forEach(tag => {
      const envelope = makeEnvelopeFromTag(tag, envelopeMeta, userCurrency)
      result[envelope.id] = envelope
    })

    // Convert accounts to envelopes
    savingAccounts.forEach(account => {
      const envelope = makeEnvelopeFromAccount(
        account,
        envelopeMeta,
        userCurrency
      )
      result[envelope.id] = envelope
    })

    // Convert debtors to envelopes
    Object.values(debtors).forEach(debtor => {
      const envelope = makeEnvelopeFromDebtor(
        debtor,
        envelopeMeta,
        userCurrency
      )
      result[envelope.id] = envelope
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

    // Fill children
    keys(result).forEach(id => {
      const envelope = result[id]
      if (!envelope.parent) return
      result[envelope.parent].children.push(envelope.id)
    })

    return result
  }
)

function makeEnvelopeFromTag(
  tag: TTagPopulated,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): IEnvelope {
  const id = getEnvelopeId(DataEntity.Tag, tag.id)
  return {
    id,
    type: DataEntity.Tag,
    entityId: tag.id,
    name: tag.name,
    symbol: tag.symbol,
    color: tag.colorHEX,
    visibility: getVisibility(info[id]?.visibility, tag.showOutcome),
    parent: tag.parent ? getEnvelopeId(DataEntity.Tag, tag.parent) : null,
    children: [], // fill later
    // children: tag.children.map(childId =>
    //   getEnvelopeId(DataEntity.Tag, childId)
    // ),
    group: info[id]?.group || defaultTagGroup,
    comment: info[id]?.comment || '',
    currency: info[id]?.currency || userCurrency,
    keepIncome: info[id]?.keepIncome || false,
    carryNegatives: info[id]?.carryNegatives || false,
  }
}

function makeEnvelopeFromAccount(
  account: IAccount,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): IEnvelope {
  const id = getEnvelopeId(DataEntity.Account, account.id)
  return {
    id,
    type: DataEntity.Account,
    entityId: account.id,
    name: account.title,
    symbol: '🏦',
    color: null,
    visibility: getVisibility(info[id]?.visibility),
    parent: info[id]?.parent || null,
    children: [],
    group: info[id]?.group || defaultAccountGroup,
    comment: info[id]?.comment || '',
    currency: info[id]?.currency || userCurrency,
    keepIncome: info[id]?.keepIncome || false,
    carryNegatives: info[id]?.carryNegatives || false,
  }
}

function makeEnvelopeFromDebtor(
  debtor: TDebtor,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): IEnvelope {
  if (debtor.merchantId) {
    const id = getEnvelopeId(DataEntity.Merchant, debtor.merchantId)
    return {
      id,
      type: DataEntity.Merchant,
      entityId: debtor.merchantId,
      name: debtor.name,
      symbol: '👤',
      color: null,
      visibility: getVisibility(info[id]?.visibility),
      parent: info[id]?.parent || null,
      children: [],
      group: info[id]?.group || defaultMerchantGroup,
      comment: info[id]?.comment || '',
      currency: info[id]?.currency || userCurrency,
      keepIncome: info[id]?.keepIncome || false,
      carryNegatives: info[id]?.carryNegatives || false,
    }
  } else {
    // It's payee (old format that depends only on payee names)
    const id = getEnvelopeId('payee', debtor.id)
    return {
      id,
      type: 'payee',
      entityId: debtor.id,
      name: debtor.name,
      symbol: '🌚',
      color: null,
      visibility: getVisibility(info[id]?.visibility),
      parent: null,
      children: [],
      group: info[id]?.group || defaultPayeeGroup,
      comment: '',
      currency: userCurrency,
      keepIncome: false,
      carryNegatives: false,
    }
  }
}

function getVisibility(
  isVisible: envelopeVisibility | undefined,
  tagShowOutcome?: boolean
): envelopeVisibility {
  if (isVisible) return isVisible
  else if (tagShowOutcome) return envelopeVisibility.visible
  else return envelopeVisibility.auto
}
