import {
  TInstrument,
  TUser,
  TCountry,
  TCompany,
  TMerchant,
  TReminder,
  ZmReminderMarker,
  ZmAccount,
  ZmReminder,
  ZmTransaction,
  ZmBudget,
  ZmDeletionObject,
  ZmCompany,
  TFxIdMap,
  ZmUser,
  TAccount,
  ZmTag,
  TTag,
  TReminderMarker,
  TTransaction,
  TransactionType,
  TBudget,
  TDeletionObject,
} from '../types'
import iconsMap from '../models/iconsMap.json'
import { TISOTimestamp, TMilliUnits, TUnits, TUnixTime } from '../types'
import { AccountId, ZmCountry, ZmInstrument, ZmMerchant } from 'types'
import toArray from 'lodash/toArray'
import { sendEvent } from 'helpers/tracking'
import { getColorForString, int2hex, int2rgb } from 'helpers/color'

// Date converters
function unixToISO(unix: TUnixTime): TISOTimestamp {
  return new Date(unix * 1000).toISOString()
}
function isoToUnix(iso: TISOTimestamp): TUnixTime {
  return new Date(iso).getTime() / 1000
}

// Value converters
function unitsToMilliunits(units: TUnits): TMilliUnits {
  return Math.round(units * 10000)
}
function milliunitsToUnits(milliunits: TMilliUnits): TUnits {
  return milliunits / 10000
}

export const dataConverters = {
  serverTimestamp: {
    toClient: (time: number) => unixToISO(time),
    toServer: (time: TISOTimestamp) => isoToUnix(time),
  },

  instrument: {
    toClient: (el: ZmInstrument): TInstrument => ({
      ...el,
      changed: unixToISO(el.changed),
    }),
    toServer: (el: TInstrument): ZmInstrument => ({
      ...el,
      changed: isoToUnix(el.changed),
    }),
  },

  company: {
    toClient: (el: ZmCompany): TCompany => ({
      ...el,
      changed: unixToISO(el.changed),
    }),
    toServer: (el: TCompany): ZmCompany => ({
      ...el,
      changed: isoToUnix(el.changed),
    }),
  },

  country: {
    toClient: (el: ZmCountry, fxIdMap: TFxIdMap): TCountry => ({
      ...el,
      fxCode: fxIdMap[el.currency],
    }),
    toServer: (el: TCountry): ZmCountry => {
      const res = { ...el, fxCode: undefined }
      delete res.fxCode
      return res
    },
  },

  user: {
    toClient: (el: ZmUser, fxIdMap: TFxIdMap): TUser => ({
      ...el,
      changed: unixToISO(el.changed),
      paidTill: unixToISO(el.paidTill),
      fxCode: fxIdMap[el.currency],
    }),
    toServer: (el: TUser): ZmUser => {
      const res = {
        ...el,
        changed: isoToUnix(el.changed),
        paidTill: isoToUnix(el.paidTill),
        fxCode: undefined,
      }
      delete res.fxCode
      return res
    },
  },

  account: {
    toClient: (el: ZmAccount, fxIdMap: TFxIdMap): TAccount => ({
      ...el,
      changed: unixToISO(el.changed),
      balance: unitsToMilliunits(el.balance),
      startBalance: unitsToMilliunits(el.startBalance),
      creditLimit: unitsToMilliunits(el.creditLimit),
      inBudget: isInBudget(el),
      fxCode: fxIdMap[el.instrument],
    }),
    toServer: (el: TAccount): ZmAccount => {
      const res = {
        ...el,
        changed: isoToUnix(el.changed),
        balance: milliunitsToUnits(el.balance),
        startBalance: milliunitsToUnits(el.startBalance),
        creditLimit: milliunitsToUnits(el.creditLimit),
        inBudget: undefined,
        fxCode: undefined,
      }
      delete res.inBudget
      delete res.fxCode
      return res
    },
  },

  tag: {
    toClient: (el: ZmTag): TTag => ({
      ...el,
      changed: unixToISO(el.changed),
      // Custom
      name: getName(el.title),
      uniqueName: getName(el.title), // temporary
      symbol: getSymbol(el), // Emoji
      children: [], // temporary
      colorRGB: int2rgb(el.color),
      colorHEX: int2hex(el.color),
      colorGenerated: getColorForString(el.title),
      // From hidden data (adds later)
      comment: null,
      currencyCode: null,
      group: null,
    }),
    toServer: (el: TTag): ZmTag => {
      const res = {
        ...el,
        changed: isoToUnix(el.changed),
        // Custom
        name: undefined,
        uniqueName: undefined,
        symbol: undefined,
        children: undefined,
        colorRGB: undefined,
        colorHEX: undefined,
        colorGenerated: undefined,
        // From hidden data
        comment: undefined,
        currencyCode: undefined,
        group: undefined,
      }
      delete res.name
      delete res.uniqueName
      delete res.symbol
      delete res.children
      delete res.colorRGB
      delete res.colorHEX
      delete res.colorGenerated
      delete res.comment
      delete res.currencyCode
      delete res.group
      return res
    },
  },

  merchant: {
    toClient: (el: ZmMerchant): TMerchant => ({
      ...el,
      changed: unixToISO(el.changed),
    }),
    toServer: (el: TMerchant): ZmMerchant => ({
      ...el,
      changed: isoToUnix(el.changed),
    }),
  },

  reminder: {
    toClient: (el: ZmReminder, fxIdMap: TFxIdMap): TReminder => ({
      ...el,
      changed: unixToISO(el.changed),
      income: unitsToMilliunits(el.income),
      outcome: unitsToMilliunits(el.outcome),
      incomeFxCode: fxIdMap[el.incomeInstrument],
      outcomeFxCode: fxIdMap[el.outcomeInstrument],
    }),
    toServer: (el: TReminder): ZmReminder => {
      const res = {
        ...el,
        changed: isoToUnix(el.changed),
        income: milliunitsToUnits(el.income),
        outcome: milliunitsToUnits(el.outcome),
        incomeFxCode: undefined,
        outcomeFxCode: undefined,
      }
      delete res.incomeFxCode
      delete res.outcomeFxCode
      return res
    },
  },

  reminderMarker: {
    toClient: (el: ZmReminderMarker, fxIdMap: TFxIdMap): TReminderMarker => ({
      ...el,
      changed: unixToISO(el.changed),
      income: unitsToMilliunits(el.income),
      outcome: unitsToMilliunits(el.outcome),
      incomeFxCode: fxIdMap[el.incomeInstrument],
      outcomeFxCode: fxIdMap[el.outcomeInstrument],
    }),
    toServer: (el: TReminderMarker): ZmReminderMarker => {
      const res = {
        ...el,
        changed: isoToUnix(el.changed),
        income: milliunitsToUnits(el.income),
        outcome: milliunitsToUnits(el.outcome),
        incomeFxCode: undefined,
        outcomeFxCode: undefined,
      }
      delete res.incomeFxCode
      delete res.outcomeFxCode
      return res
    },
  },

  transaction: {
    toClient: (
      el: ZmTransaction,
      fxIdMap: TFxIdMap,
      debtAccountId: AccountId
    ): TTransaction => ({
      ...el,
      // Converted
      changed: unixToISO(el.changed),
      created: unixToISO(el.created),
      income: unitsToMilliunits(el.income),
      outcome: unitsToMilliunits(el.outcome),
      opIncome: el.opIncome && unitsToMilliunits(el.opIncome),
      opOutcome: el.opOutcome && unitsToMilliunits(el.opOutcome),
      // Custom
      incomeFxCode: fxIdMap[el.incomeInstrument],
      outcomeFxCode: fxIdMap[el.outcomeInstrument],
      opIncomeFxCode: el.opIncomeInstrument && fxIdMap[el.opIncomeInstrument],
      opOutcomeFxCode:
        el.opOutcomeInstrument && fxIdMap[el.opOutcomeInstrument],
      time: getTransactionTime(el),
      type: getTransactionType(el, debtAccountId),
      mainTag: getTransactionMainTag(el),
    }),
    toServer: (el: TTransaction): ZmTransaction => {
      const res = {
        ...el,
        // Converted
        changed: isoToUnix(el.changed),
        created: isoToUnix(el.created),
        income: milliunitsToUnits(el.income),
        outcome: milliunitsToUnits(el.outcome),
        opIncome: el.opIncome && milliunitsToUnits(el.opIncome),
        opOutcome: el.opOutcome && milliunitsToUnits(el.opOutcome),
        // Custom
        incomeFxCode: undefined,
        outcomeFxCode: undefined,
        opIncomeFxCode: undefined,
        opOutcomeFxCode: undefined,
        time: undefined,
        type: undefined,
        mainTag: undefined,
      }
      delete res.incomeFxCode
      delete res.outcomeFxCode
      delete res.opIncomeFxCode
      delete res.opOutcomeFxCode
      delete res.time
      delete res.type
      delete res.mainTag
      return res
    },
  },

  budget: {
    toClient: (el: ZmBudget): TBudget => ({
      ...el,
      changed: unixToISO(el.changed),
      income: unitsToMilliunits(el.income),
      outcome: unitsToMilliunits(el.outcome),
    }),
    toServer: (el: TBudget): ZmBudget => ({
      ...el,
      changed: isoToUnix(el.changed),
      income: milliunitsToUnits(el.income),
      outcome: milliunitsToUnits(el.outcome),
    }),
  },

  deletion: {
    toClient: (el: ZmDeletionObject): TDeletionObject => ({
      ...el,
      stamp: unixToISO(el.stamp),
    }),
    toServer: (el: TDeletionObject): ZmDeletionObject => ({
      ...el,
      stamp: isoToUnix(el.stamp),
    }),
  },
}

// Helpers

function isInBudget(acc: ZmAccount): boolean {
  if (acc.type === 'debt') return false
  if (acc.title.endsWith('📍')) return true
  return acc.inBalance
}

function getName(title: string) {
  const titleArr = toArray(title)
  if (isEmoji(titleArr[0])) {
    titleArr.shift()
    return titleArr.join('').trim()
  } else {
    return title
  }
}

function getSymbol(tag: ZmTag) {
  if (tag.id === 'null') return '?'
  if (tag.icon) {
    if (iconsMap[tag.icon]) {
      return iconsMap[tag.icon]
    } else {
      sendEvent('Tags: UnknownNames: ' + tag.icon)
    }
  }
  return tag.title.slice(0, 2)
}

function isEmoji(str: string) {
  const regex =
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return str && str.match(regex)
}

function getTransactionType(
  tr: ZmTransaction,
  debtId: AccountId
): TransactionType {
  if (debtId && tr.incomeAccount === debtId) return 'outcomeDebt'
  if (debtId && tr.outcomeAccount === debtId) return 'incomeDebt'
  if (tr.income && tr.outcome) return 'transfer'
  if (tr.outcome) return 'outcome'
  return 'income'
}

function getTransactionTime(tr: ZmTransaction): TISOTimestamp {
  const date = new Date(tr.date)
  const creationDate = new Date(tr.created)
  creationDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  return creationDate.toISOString()
}

function getTransactionMainTag(tr: ZmTransaction) {
  if (tr.tag) return tr.tag[0]
  else return null
}
