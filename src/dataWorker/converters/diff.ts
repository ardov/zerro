import { TDiff, TZmDiff } from 'shared/types'
import { convertAccount } from './account'
import { convertBudget } from './budget'
import { convertCompany } from './company'
import { convertCountry } from './country'
import { convertDeletion } from './deletion'
import { convertInstrument } from './instrument'
import { convertMerchant } from './merchant'
import { convertReminder } from './reminder'
import { convertReminderMarker } from './reminderMarker'
import { convertTag } from './tag'
import { convertTransaction } from './transaction'
import { convertUser } from './user'
import { msToUnix, TZmAdapter, zmDateToMs } from 'shared/helpers/adapterUtils'

export const convertDiff: TZmAdapter<TZmDiff, TDiff> = {
  toClient: d => {
    let r: TDiff = { serverTimestamp: 0 }
    if (d.serverTimestamp) r.serverTimestamp = zmDateToMs(d.serverTimestamp)
    if (d.deletion) r.deletion = d.deletion.map(convertDeletion.toClient)
    if (d.instrument)
      r.instrument = d.instrument.map(convertInstrument.toClient)
    if (d.country) r.country = d.country.map(convertCountry.toClient)
    if (d.company) r.company = d.company.map(convertCompany.toClient)
    if (d.user) r.user = d.user.map(convertUser.toClient)
    if (d.account) r.account = d.account.map(convertAccount.toClient)
    if (d.merchant) r.merchant = d.merchant.map(convertMerchant.toClient)
    if (d.tag) r.tag = d.tag.map(convertTag.toClient)
    if (d.budget) r.budget = d.budget.map(convertBudget.toClient)
    if (d.reminder) r.reminder = d.reminder.map(convertReminder.toClient)
    if (d.reminderMarker)
      r.reminderMarker = d.reminderMarker.map(convertReminderMarker.toClient)
    if (d.transaction)
      r.transaction = d.transaction.map(convertTransaction.toClient)
    return r
  },
  toServer: d => {
    let r: TZmDiff = { serverTimestamp: 0 }
    if (d.serverTimestamp) r.serverTimestamp = msToUnix(d.serverTimestamp)
    if (d.deletion) r.deletion = d.deletion.map(convertDeletion.toServer)
    if (d.instrument)
      r.instrument = d.instrument.map(convertInstrument.toServer)
    if (d.country) r.country = d.country.map(convertCountry.toServer)
    if (d.company) r.company = d.company.map(convertCompany.toServer)
    if (d.user) r.user = d.user.map(convertUser.toServer)
    if (d.account) r.account = d.account.map(convertAccount.toServer)
    if (d.merchant) r.merchant = d.merchant.map(convertMerchant.toServer)
    if (d.tag) r.tag = d.tag.map(convertTag.toServer)
    if (d.budget) r.budget = d.budget.map(convertBudget.toServer)
    if (d.reminder) r.reminder = d.reminder.map(convertReminder.toServer)
    if (d.reminderMarker)
      r.reminderMarker = d.reminderMarker.map(convertReminderMarker.toServer)
    if (d.transaction)
      r.transaction = d.transaction.map(convertTransaction.toServer)
    return r
  },
}
