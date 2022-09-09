import {
  ById,
  DataEntity,
  TAccount,
  TEnvelopeId,
  TEnvelopeType,
  TFxCode,
} from '@shared/types'
import { TDebtor } from '@entities/debtors'
import { TTagPopulated } from '@entities/tag'
import { getEnvelopeId } from './helpers'
import { TEnvelopeMeta, envelopeVisibility } from './metaData'

const defaultTagGroup = 'Категории'
const defaultAccountGroup = 'Переводы'
const defaultMerchantGroup = 'Долги'
const defaultPayeeGroup = 'Долги'

export type TEnvelope = {
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

export const makeEnvelope = {
  tag: makeEnvelopeFromTag,
  account: makeEnvelopeFromAccount,
  debtor: makeEnvelopeFromDebtor,
}

function makeEnvelopeFromTag(
  tag: TTagPopulated,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
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
    children: [],
    index: info[id]?.index || -1,
    group: info[id]?.group || defaultTagGroup,
    comment: info[id]?.comment || '',
    currency: info[id]?.currency || userCurrency,
    keepIncome: info[id]?.keepIncome || false,
    carryNegatives: info[id]?.carryNegatives || false,
  }
}

function makeEnvelopeFromAccount(
  account: TAccount,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
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
): TEnvelope {
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
