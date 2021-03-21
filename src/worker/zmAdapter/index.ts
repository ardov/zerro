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

export function toClient(d: ZmDiff): Diff {
  let r: Diff = { serverTimestamp: 0 }
  if (d.serverTimestamp)
    r.serverTimestamp = convert.serverTimestamp.toClient(d.serverTimestamp)
  if (d.deletion) r.deletion = d.deletion.map(convert.deletion.toClient)
  if (d.instrument) r.instrument = d.instrument.map(convert.instrument.toClient)
  if (d.country) r.country = d.country.map(convert.country.toClient)
  if (d.company) r.company = d.company.map(convert.company.toClient)
  if (d.user) r.user = d.user.map(convert.user.toClient)
  if (d.account) r.account = d.account.map(convert.account.toClient)
  if (d.merchant) r.merchant = d.merchant.map(convert.merchant.toClient)
  if (d.tag) r.tag = d.tag.map(convert.tag.toClient)
  if (d.budget) r.budget = d.budget.map(convert.budget.toClient)
  if (d.reminder) r.reminder = d.reminder.map(convert.reminder.toClient)
  if (d.reminderMarker)
    r.reminderMarker = d.reminderMarker.map(convert.reminderMarker.toClient)
  if (d.transaction)
    r.transaction = d.transaction.map(convert.transaction.toClient)
  return r
}
