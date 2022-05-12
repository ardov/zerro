import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { useMonth } from '../pathHooks'
import { useSearchParam } from 'helpers/useSearchParam'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { getInBudgetAccounts } from 'store/data/accounts'
import { getTagAccMap } from 'store/data/hiddenData/accTagMap'
import { getPopulatedTags } from 'store/data/tags'
import { FilterConditions } from 'store/data/transactions/filtering'
import endOfMonth from 'date-fns/endOfMonth'

export const BudgetTransactionsDrawer: FC = () => {
  const [month] = useMonth()
  const [id, setId] = useSearchParam('transactions')
  const accountsInBudget = useSelector(getInBudgetAccounts).map(a => a.id)
  const tagAccMap = useSelector(getTagAccMap)
  const tagsById = useSelector(getPopulatedTags)

  const onClose = () => setId(undefined)

  if (!id) return <TransactionsDrawer open={false} onClose={onClose} />

  const tag = tagsById[id]
  const tagIds = [tag.id, ...tag.children]

  let prefilter: FilterConditions[] = []
  prefilter.push({
    type: 'outcome',
    dateFrom: month,
    dateTo: endOfMonth(month),
    accountsFrom: accountsInBudget,
    mainTags: tagIds,
  })
  tagIds.forEach(id => {
    if (tagAccMap[id]) {
      prefilter.push({
        type: 'transfer',
        dateFrom: month,
        dateTo: endOfMonth(month),
        accountsFrom: accountsInBudget,
        accountsTo: tagAccMap[id],
      })
      prefilter.push({
        type: 'transfer',
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
