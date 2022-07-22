import React, { FC } from 'react'
import { useAppSelector } from 'store'
import { useSearchParam } from 'shared/hooks/useSearchParam'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { getInBudgetAccounts } from 'models/account'
import { getTagAccMap } from 'models/hiddenData/accTagMap'
import { getPopulatedTags } from 'models/tag'
import { FilterConditions } from 'models/transaction/filtering'
import { endOfMonth } from 'shared/helpers/date'
import { TrType } from 'models/transaction'
import { useMonth } from '../model'

export const BudgetTransactionsDrawer: FC = () => {
  const [month] = useMonth()
  const [id, setId] = useSearchParam('transactions')
  const accountsInBudget = useAppSelector(getInBudgetAccounts).map(a => a.id)
  const tagAccMap = useAppSelector(getTagAccMap)
  const tagsById = useAppSelector(getPopulatedTags)

  const onClose = () => setId(undefined)

  if (!id) return <TransactionsDrawer open={false} onClose={onClose} />

  const tag = tagsById[id]
  const tagIds = [tag.id, ...tag.children]

  let prefilter: FilterConditions[] = []
  prefilter.push({
    type: TrType.Outcome,
    dateFrom: month,
    dateTo: endOfMonth(month),
    accountsFrom: accountsInBudget,
    mainTags: tagIds,
  })
  tagIds.forEach(id => {
    if (tagAccMap[id]) {
      prefilter.push({
        type: TrType.Transfer,
        dateFrom: month,
        dateTo: endOfMonth(month),
        accountsFrom: accountsInBudget,
        accountsTo: tagAccMap[id],
      })
      prefilter.push({
        type: TrType.Transfer,
        dateFrom: month,
        dateTo: endOfMonth(month),
        accountsFrom: tagAccMap[id],
        accountsTo: accountsInBudget,
      })
    }
  })

  return (
    <TransactionsDrawer prefilter={prefilter} open={!!id} onClose={onClose} />
  )
}
