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
import { getColorForString } from '@shared/helpers/color'

const defaultTagGroup = 'Категории'
const defaultAccountGroup = 'Переводы'
const defaultMerchantGroup = 'Долги'
const defaultPayeeGroup = 'Долги'

export type TEnvelope = {
  id: TEnvelopeId
  type: TEnvelopeType
  entityId: string // Used to connect with ZM entity

  name: string // derived
  originalName: string // ZM entity title
  symbol: string // From ZM entity
  color: string | null // for tags only
  colorGenerated: string // generated based on title
  children: TEnvelopeId[] // ids of children envelopes
  parent: TEnvelopeId | null // parent from tag or custom storage

  // From custom storage
  index: number // calculated prop
  indexRaw: number | undefined // from custom storage

  visibility: envelopeVisibility // derived
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

type TMaker<T> = {
  tag: (el: TTagPopulated, userFx: TFxCode, meta?: TEnvelopeMeta) => T
  account: (el: TAccount, userFx: TFxCode, meta?: TEnvelopeMeta) => T
  debtor: (el: TDebtor, userFx: TFxCode, meta?: TEnvelopeMeta) => T
}

type TFuncs = {
  id: TMaker<TEnvelope['id']>
  entityId: TMaker<TEnvelope['entityId']>
  type: TMaker<TEnvelope['type']>
  name: TMaker<TEnvelope['name']>
  originalName: TMaker<TEnvelope['originalName']>
  symbol: TMaker<TEnvelope['symbol']>
  color: TMaker<TEnvelope['color']>
  colorGenerated: TMaker<TEnvelope['colorGenerated']>
  parent: TMaker<TEnvelope['parent']>
  children: TMaker<TEnvelope['children']>
  index: TMaker<TEnvelope['index']>
  indexRaw: TMaker<TEnvelope['indexRaw']>
  visibility: TMaker<TEnvelope['visibility']>
  group: TMaker<TEnvelope['group']>
  comment: TMaker<TEnvelope['comment']>
  currency: TMaker<TEnvelope['currency']>
  keepIncome: TMaker<TEnvelope['keepIncome']>
  carryNegatives: TMaker<TEnvelope['carryNegatives']>
}

const funcs: TFuncs = {
  id: {
    tag: el => getEnvelopeId(DataEntity.Tag, el.id),
    account: el => getEnvelopeId(DataEntity.Account, el.id),
    debtor: el =>
      el.merchantId
        ? getEnvelopeId(DataEntity.Merchant, el.merchantId)
        : getEnvelopeId('payee', el.id),
  },
  entityId: {
    tag: el => el.id,
    account: el => el.id,
    debtor: el => (el.merchantId ? el.merchantId : el.id),
  },
  type: {
    tag: () => DataEntity.Tag,
    account: () => DataEntity.Account,
    debtor: el => (el.merchantId ? DataEntity.Merchant : 'payee'),
  },
  name: {
    tag: el => el.name,
    account: el => el.title,
    debtor: el => el.name,
  },
  originalName: {
    tag: el => el.title,
    account: el => el.title,
    debtor: el => el.name,
  },
  symbol: {
    tag: el => el.symbol,
    account: () => '🏦',
    debtor: () => '👤',
  },
  color: {
    tag: tag => (tag.id === 'null' ? '#ff0000' : tag.colorHEX),
    account: () => null,
    debtor: () => null,
  },
  colorGenerated: {
    tag: el => getColorForString(el.title),
    account: el => getColorForString(el.title),
    debtor: el => getColorForString(el.name),
  },
  parent: {
    tag: el => (el.parent ? getEnvelopeId(DataEntity.Tag, el.parent) : null),
    account: (el, fx, meta) => meta?.parent || null,
    debtor: (el, fx, meta) => meta?.parent || null,
  },
  children: {
    tag: el => [],
    account: el => [],
    debtor: el => [],
  },
  index: {
    tag: (el, fx, meta) => meta?.index || -1,
    account: (el, fx, meta) => meta?.index || -1,
    debtor: (el, fx, meta) => meta?.index || -1,
  },
  indexRaw: {
    tag: (el, fx, meta) => meta?.index,
    account: (el, fx, meta) => meta?.index,
    debtor: (el, fx, meta) => meta?.index,
  },
  group: {
    tag: (el, fx, meta) => meta?.group || defaultTagGroup,
    account: (el, fx, meta) => meta?.group || defaultAccountGroup,
    debtor: (el, fx, meta) =>
      meta?.group || (el.merchantId ? defaultMerchantGroup : defaultPayeeGroup),
  },
  visibility: {
    tag: (el, fx, meta) => getVisibility(meta?.visibility, el.showOutcome),
    account: (el, fx, meta) => getVisibility(meta?.visibility),
    debtor: (el, fx, meta) => getVisibility(meta?.visibility),
  },
  comment: {
    tag: (el, fx, meta) => meta?.comment || '',
    account: (el, fx, meta) => meta?.comment || '',
    debtor: (el, fx, meta) => meta?.comment || '',
  },
  currency: {
    tag: (el, fx, meta) => meta?.currency || fx,
    account: (el, fx, meta) => meta?.currency || fx,
    debtor: (el, fx, meta) => meta?.currency || fx,
  },
  keepIncome: {
    tag: (el, fx, meta) => meta?.keepIncome || false,
    account: (el, fx, meta) => meta?.keepIncome || false,
    debtor: (el, fx, meta) => meta?.keepIncome || false,
  },
  carryNegatives: {
    tag: (el, fx, meta) => meta?.carryNegatives || false,
    account: (el, fx, meta) => meta?.carryNegatives || false,
    debtor: (el, fx, meta) => meta?.carryNegatives || false,
  },
}

function makeEnvelopeFromTag(
  el: TTagPopulated,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
  const id = funcs.id.tag(el, userCurrency)
  const meta = info[id]
  return {
    id,
    type: funcs.type.tag(el, userCurrency, meta),
    entityId: funcs.entityId.tag(el, userCurrency, meta),
    name: funcs.name.tag(el, userCurrency, meta),
    originalName: funcs.originalName.tag(el, userCurrency, meta),
    symbol: funcs.symbol.tag(el, userCurrency, meta),
    color: funcs.color.tag(el, userCurrency, meta),
    colorGenerated: funcs.colorGenerated.tag(el, userCurrency, meta),
    visibility: funcs.visibility.tag(el, userCurrency, meta),
    parent: funcs.parent.tag(el, userCurrency, meta),
    children: funcs.children.tag(el, userCurrency, meta),
    index: funcs.index.tag(el, userCurrency, meta),
    indexRaw: funcs.indexRaw.tag(el, userCurrency, meta),
    group: funcs.group.tag(el, userCurrency, meta),
    comment: funcs.comment.tag(el, userCurrency, meta),
    currency: funcs.currency.tag(el, userCurrency, meta),
    keepIncome: funcs.keepIncome.tag(el, userCurrency, meta),
    carryNegatives: funcs.carryNegatives.tag(el, userCurrency, meta),
  }
}
function makeEnvelopeFromAccount(
  el: TAccount,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
  const id = funcs.id.account(el, userCurrency)
  const meta = info[id]
  return {
    id,
    type: funcs.type.account(el, userCurrency, meta),
    entityId: funcs.entityId.account(el, userCurrency, meta),
    name: funcs.name.account(el, userCurrency, meta),
    originalName: funcs.originalName.account(el, userCurrency, meta),
    symbol: funcs.symbol.account(el, userCurrency, meta),
    color: funcs.color.account(el, userCurrency, meta),
    colorGenerated: funcs.colorGenerated.account(el, userCurrency, meta),
    visibility: funcs.visibility.account(el, userCurrency, meta),
    parent: funcs.parent.account(el, userCurrency, meta),
    children: funcs.children.account(el, userCurrency, meta),
    index: funcs.index.account(el, userCurrency, meta),
    indexRaw: funcs.indexRaw.account(el, userCurrency, meta),
    group: funcs.group.account(el, userCurrency, meta),
    comment: funcs.comment.account(el, userCurrency, meta),
    currency: funcs.currency.account(el, userCurrency, meta),
    keepIncome: funcs.keepIncome.account(el, userCurrency, meta),
    carryNegatives: funcs.carryNegatives.account(el, userCurrency, meta),
  }
}
function makeEnvelopeFromDebtor(
  el: TDebtor,
  info: ById<TEnvelopeMeta>,
  userCurrency: TFxCode
): TEnvelope {
  const id = funcs.id.debtor(el, userCurrency)
  const meta = info[id]
  return {
    id,
    type: funcs.type.debtor(el, userCurrency, meta),
    entityId: funcs.entityId.debtor(el, userCurrency, meta),
    name: funcs.name.debtor(el, userCurrency, meta),
    originalName: funcs.originalName.debtor(el, userCurrency, meta),
    symbol: funcs.symbol.debtor(el, userCurrency, meta),
    color: funcs.color.debtor(el, userCurrency, meta),
    colorGenerated: funcs.colorGenerated.debtor(el, userCurrency, meta),
    visibility: funcs.visibility.debtor(el, userCurrency, meta),
    parent: funcs.parent.debtor(el, userCurrency, meta),
    children: funcs.children.debtor(el, userCurrency, meta),
    index: funcs.index.debtor(el, userCurrency, meta),
    indexRaw: funcs.indexRaw.debtor(el, userCurrency, meta),
    group: funcs.group.debtor(el, userCurrency, meta),
    comment: funcs.comment.debtor(el, userCurrency, meta),
    currency: funcs.currency.debtor(el, userCurrency, meta),
    keepIncome: funcs.keepIncome.debtor(el, userCurrency, meta),
    carryNegatives: funcs.carryNegatives.debtor(el, userCurrency, meta),
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
