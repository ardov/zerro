import { getMerchants } from '@entities/merchant'
import { cleanPayee } from '../shared/cleanPayee'
import { createSelector } from '@reduxjs/toolkit'
import { TTransaction } from '@shared/types'
import { TSelector } from '@store/index'

export const debtorGetter: TSelector<(tr: TTransaction) => string> =
  createSelector([getMerchants], merchants => tr => {
    const merchantTitle = tr.merchant && merchants[tr.merchant]?.title
    return cleanPayee(merchantTitle || tr.payee || '')
  })
