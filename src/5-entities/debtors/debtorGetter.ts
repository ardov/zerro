import { merchantModel } from '5-entities/merchant'
import { cleanPayee } from '../shared/cleanPayee'
import { createSelector } from '@reduxjs/toolkit'
import { TTransaction } from '6-shared/types'
import { TSelector } from 'store/index'

export const debtorGetter: TSelector<(tr: TTransaction) => string> =
  createSelector([merchantModel.getMerchants], merchants => tr => {
    const merchantTitle = tr.merchant && merchants[tr.merchant]?.title
    return cleanPayee(merchantTitle || tr.payee || '')
  })
