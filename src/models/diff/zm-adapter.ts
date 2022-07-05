import { convertAccount } from 'models/account'
import { convertBudget } from 'models/budget'
import { convertCompany } from 'models/company'
import { convertCountry } from 'models/country'
import { convertDeletion } from 'models/deletion'
import { convertInstrument } from 'models/instrument'
import { convertMerchant } from 'models/merchant'
import { convertReminder } from 'models/reminder'
import { convertReminderMarker } from 'models/reminderMarker'
import { convertTag } from 'models/tag'
import { convertTransaction } from 'models/transaction'
import { convertUser } from 'models/user'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { TDiff, TZmDiff } from 'shared/types'

export const convertDiff: TZmAdapter<TZmDiff, TDiff> = {
  toClient: d => {
    let r: TDiff = { serverTimestamp: 0 }
    if (d.serverTimestamp) r.serverTimestamp = unixToMs(d.serverTimestamp)
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
