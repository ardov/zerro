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
  originalName: string // ZM title
  symbol: string // From ZM entity
  color: string | null
  visibility: envelopeVisibility
  // For tags getting this props from ZM entity
  // For other types store in custom storage
  parent: TEnvelopeId | null
  children: TEnvelopeId[]
  // From custom storage
  index: number
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
    let list: IEnvelope[] = []
    let result: ById<IEnvelope> = {}

    // Convert tags to envelopes
    Object.values(tags).forEach(tag => {
      list.push(makeEnvelopeFromTag(tag, envelopeMeta, userCurrency))
    })

    // Convert accounts to envelopes
    savingAccounts.forEach(account => {
      list.push(makeEnvelopeFromAccount(account, envelopeMeta, userCurrency))
    })

    // Convert debtors to envelopes
    Object.values(debtors).forEach(debtor => {
      list.push(makeEnvelopeFromDebtor(debtor, envelopeMeta, userCurrency))
    })

    // Fix nesting issues (only 2 levels are allowed)
    list.forEach(envelope => {
      if (!envelope.parent) return
      envelope.parent = getParent(envelope)
      // Use recursion to get topmost parent id
      function getParent(envelope?: IEnvelope): IEnvelope['parent'] {
        if (!envelope) return null
        if (!envelope.parent) return envelope.id
        return getParent(list.find(e => e.id === envelope.parent))
      }
    })

    // Sort array
    list.sort(compareEnvelopes).forEach((e, i) => {
      e.index = i // update index (to compare later)
      result[e.id] = e // add to result
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
    originalName: tag.title,
    symbol: tag.symbol,
    color: tag.colorHEX,
    visibility: getVisibility(info[id]?.visibility, tag.showOutcome),
    parent: tag.parent ? getEnvelopeId(DataEntity.Tag, tag.parent) : null,
    children: [], // fill later
    // children: tag.children.map(childId =>
    //   getEnvelopeId(DataEntity.Tag, childId)
    // ),
    index: info[id]?.index || -1,
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
    originalName: account.title,
    symbol: '🏦',
    color: null,
    visibility: getVisibility(info[id]?.visibility),
    parent: info[id]?.parent || null,
    children: [],
    index: info[id]?.index || -1,
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
      originalName: debtor.name,
      symbol: '👤',
      color: null,
      visibility: getVisibility(info[id]?.visibility),
      parent: info[id]?.parent || null,
      children: [],
      index: info[id]?.index || -1,
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
      originalName: debtor.name,
      symbol: '🌚',
      color: null,
      visibility: getVisibility(info[id]?.visibility),
      parent: null,
      children: [],
      index: info[id]?.index || -1,
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

function compareEnvelopes(a: IEnvelope, b: IEnvelope) {
  // Sort by index if it's set (!== -1)
  if (a.index !== -1 && b.index !== -1) return a.index - b.index
  if (a.index !== -1) return -1
  if (b.index !== -1) return 1

  // Sort by type
  if (a.type !== b.type) {
    const typeOrder = [
      DataEntity.Tag,
      DataEntity.Account,
      DataEntity.Merchant,
      'payee',
    ]
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  }

  // Sort by name
  return a.name.localeCompare(b.name)
}
