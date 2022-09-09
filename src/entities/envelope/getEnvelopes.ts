import { createSelector } from '@reduxjs/toolkit'
import {
  ById,
  DataEntity,
  IAccount,
  TEnvelopeId,
  TEnvelopeType,
  TFxCode,
} from '@shared/types'
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

type TGroup = {
  name: string
  children: {
    id: TEnvelopeId
    children: TEnvelopeId[]
  }[]
}

const getCompiledEnvelopes: TSelector<{
  byId: ById<IEnvelope>
  structure: TGroup[]
}> = createSelector(
  [
    getDebtors,
    getPopulatedTags,
    getSavingAccounts,
    getEnvelopeMeta,
    getUserCurrencyCode,
  ],
  (debtors, tags, savingAccounts, envelopeMeta, userCurrency) => {
    let result: ById<IEnvelope> = {}

    // Step 1. Create envelopes from tags, saving accounts and debtors
    Object.values(tags).forEach(tag => {
      const e = makeEnvelopeFromTag(tag, envelopeMeta, userCurrency)
      result[e.id] = e
    })
    savingAccounts.forEach(account => {
      const e = makeEnvelopeFromAccount(account, envelopeMeta, userCurrency)
      result[e.id] = e
    })
    Object.values(debtors).forEach(debtor => {
      const e = makeEnvelopeFromDebtor(debtor, envelopeMeta, userCurrency)
      result[e.id] = e
    })

    // Step 2. Update indices, prepare for building tree
    const list = Object.values(result)
      .sort(compareEnvelopes)
      .map((e, i) => {
        // update index (to compare later)
        e.index = i
        // Fix nesting issues (only 2 levels are allowed)
        e.parent = getRightParent(e.parent, result)
        if (e.parent) {
          const parent = result[e.parent]
          // Attach child to parent
          parent.children.push(e.id)
          // Inherit group names from parents
          e.group = result[e.parent].group
        }
        return e
      })

    // Step 3. Build structure and update indicies according to it
    const structure = buildStructure(result)
    const flatList = flattenStructure(structure)
    // Update indicies
    flatList.forEach((id, index) => {
      result[id].index = index
    })

    return {
      byId: result,
      structure,
    }
  }
)

export const getEnvelopes: TSelector<ById<IEnvelope>> = state =>
  getCompiledEnvelopes(state).byId
export const getEnvelopeStructure: TSelector<TGroup[]> = state =>
  getCompiledEnvelopes(state).structure

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

/**
 * Returns id of the topmost parent. So it flattens envelopes to only 2 levels of depth
 * @param parentId
 * @param byId
 * @returns
 */
function getRightParent(
  parentId: IEnvelope['parent'],
  byId: ById<IEnvelope>
): IEnvelope['parent'] {
  if (!parentId) return null
  const parent = byId[parentId]
  if (!parent) return null
  if (!parent.parent) return parentId
  return getRightParent(parent.parent, byId)
}

/**
 * Builds a tree of sorted groups
 * @param envelopes
 * @returns
 */
function buildStructure(envelopes: ById<IEnvelope>): TGroup[] {
  const groupCollection: Record<string, TGroup> = {}
  Object.values(envelopes)
    .sort(compareEnvelopes)
    .filter(e => !e.parent)
    .forEach(e => {
      groupCollection[e.group] ??= { name: e.group, children: [] }
      groupCollection[e.group].children.push({ id: e.id, children: e.children })
    })

  const groupList = Object.values(groupCollection).sort((a, b) => {
    let envA = envelopes[a.children[0].id]
    let envB = envelopes[b.children[0].id]
    return compareEnvelopes(envA, envB)
  })

  return groupList
}

/**
 * Flattens structure to an id array
 * @param tree
 * @returns list of envelope ids
 */
function flattenStructure(tree: TGroup[]): TEnvelopeId[] {
  let flatList: TEnvelopeId[] = []
  tree.forEach(group => {
    group.children.forEach(({ id, children }) => {
      flatList = [...flatList, id, ...children]
    })
  })
  return flatList
}

function compareEnvelopes(a: IEnvelope, b: IEnvelope) {
  // Sort by index if it's present (!== -1)
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

  // Null category should be the first one
  const nullTagId = getEnvelopeId(DataEntity.Tag, null)
  if (a.id === nullTagId) return -1
  if (b.id === nullTagId) return 1

  // Finally sort by name
  return a.name.localeCompare(b.name)
}
