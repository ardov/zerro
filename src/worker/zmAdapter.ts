import { ZmDiff, Diff } from 'types'
import { dataConverters as convert } from './dataConverters'

export function toServer(d: Diff): ZmDiff {
  let r: ZmDiff = { serverTimestamp: 0 }
  if (d.serverTimestamp)
    r.serverTimestamp = convert.serverTimestamp.toServer(d.serverTimestamp)
  if (d.deletion) r.deletion = d.deletion.map(convert.deletion.toServer)
  if (d.instrument) r.instrument = d.instrument.map(convert.instrument.toServer)
  if (d.country) r.country = d.country.map(convert.country.toServer)
  if (d.company) r.company = d.company.map(convert.company.toServer)
  if (d.user) r.user = d.user.map(convert.user.toServer)
  if (d.account) r.account = d.account.map(convert.account.toServer)
  if (d.merchant) r.merchant = d.merchant.map(convert.merchant.toServer)
  if (d.tag) r.tag = d.tag.map(convert.tag.toServer)
  if (d.budget) r.budget = d.budget.map(convert.budget.toServer)
  if (d.reminder) r.reminder = d.reminder.map(convert.reminder.toServer)
  if (d.reminderMarker)
    r.reminderMarker = d.reminderMarker.map(convert.reminderMarker.toServer)
  if (d.transaction)
    r.transaction = d.transaction.map(convert.transaction.toServer)
  return r
}

export function toLocal(d: ZmDiff): Diff {
  let r: Diff = { serverTimestamp: 0 }
  if (d.serverTimestamp)
    r.serverTimestamp = convert.serverTimestamp.toLocal(d.serverTimestamp)
  if (d.deletion) r.deletion = d.deletion.map(convert.deletion.toLocal)
  if (d.instrument) r.instrument = d.instrument.map(convert.instrument.toLocal)
  if (d.country) r.country = d.country.map(convert.country.toLocal)
  if (d.company) r.company = d.company.map(convert.company.toLocal)
  if (d.user) r.user = d.user.map(convert.user.toLocal)
  if (d.account) r.account = d.account.map(convert.account.toLocal)
  if (d.merchant) r.merchant = d.merchant.map(convert.merchant.toLocal)
  if (d.tag) r.tag = d.tag.map(convert.tag.toLocal)
  if (d.budget) r.budget = d.budget.map(convert.budget.toLocal)
  if (d.reminder) r.reminder = d.reminder.map(convert.reminder.toLocal)
  if (d.reminderMarker)
    r.reminderMarker = d.reminderMarker.map(convert.reminderMarker.toLocal)
  if (d.transaction)
    r.transaction = d.transaction.map(convert.transaction.toLocal)
  return r
}
