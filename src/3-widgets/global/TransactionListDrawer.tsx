import type { EnvTransactionsDrawerProps } from './EnvTransactionsDrawer'
import type { TTransactionId } from '@/6-shared/types'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import {
  defineScreenInstances,
  useIsTopScreen,
  useScreenOrder,
} from '@/6-shared/overlays'
import { ListDetailsSurface } from '@/6-shared/ui/layout/ListDetailsSurface'
import { core } from '@/zerro-core/redux'
import type { TTransactionListProps } from '../transaction/TransactionList'
import { TransactionList } from '../transaction/TransactionList'
import { TransactionPreview } from '../transaction/TransactionPreview'
import { usePendingEdit } from '../transaction/TransactionPreview/usePendingEdit'
import { useTransactionHandover } from '../transaction/TransactionPreview/useTransactionHandover'
import {
  useTransactionListView,
  type TransactionListViewState,
} from './useTransactionListView'

export type TransactionDrawerProps = {
  title?: string
  /** Entity identifiers keep the list live across edits and reloads. */
  ids?: TTransactionId[]
  initialQuery?: core.transactions.TTransactionQuery
  initialDate?: TTransactionListProps['initialDate']
}

type TransactionListValue = TransactionDrawerProps & {
  view?: TransactionListViewState
  /** The serialized envelope-list entry used before repeated instances. */
  envelopeConditions?: EnvTransactionsDrawerProps['envelopeConditions']
}
type DetailsValue = {
  ownerListId: string
  content: { kind: 'transaction'; id: TTransactionId }
}

const transactionLists =
  defineScreenInstances<TransactionListValue>('transactionList')
const legacyEnvelopeLists = defineScreenInstances<TransactionListValue>(
  'envelopeTransactions'
)
const transactionDetails =
  defineScreenInstances<DetailsValue>('transactionDetails')

export const useTransactionDrawer = () => transactionLists.useOpen()

/** Both list openers share a family, so DOM order follows opening order even
 * when an envelope list and an ordinary list are restored together. */
export function TransactionListDrawer() {
  const current = transactionLists.use()
  const legacy = legacyEnvelopeLists.use()
  const order = useScreenOrder()
  const instances = [...current.instances, ...legacy.instances].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  )
  const [rendered, setRendered] = useState(instances)
  const additions = instances.filter(
    instance => !rendered.some(old => old.id === instance.id)
  )
  if (additions.length) setRendered([...rendered, ...additions])
  return rendered.map(({ id }) => (
    <TransactionListInstance
      key={id}
      id={id}
      onExited={() =>
        setRendered(previous => previous.filter(instance => instance.id !== id))
      }
    />
  ))
}

function TransactionListInstance({
  id,
  onExited,
}: {
  id: string
  onExited: () => void
}) {
  const { t } = useTranslation('common')
  const [value, setValue] = transactionLists.useInstance(id)
  const { close } = transactionLists.use()
  const details = transactionDetails.use()
  const openDetails = transactionDetails.useOpen()
  const liveDetails = details.instances.find(
    instance => instance.value.ownerListId === id
  )
  const active = useIsTopScreen(id, liveDetails?.id)
  const shownDetailsId = useCachedValue(liveDetails?.id, !!liveDetails)
  const saved = useCachedValue(value, !!value)
  const shown = saved && normalizeListValue(saved)
  const setViewValue = useCallback(
    (update: (previous: TransactionListValue) => TransactionListValue) =>
      setValue(previous => update(normalizeListValue(previous))),
    [setValue]
  )
  const { view, flushScroll } = useTransactionListView(shown, setViewValue)
  const closeList = () => {
    flushScroll()
    close(id, { through: true })
  }
  const showTransaction = (transactionId: TTransactionId) => {
    flushScroll()
    const content = { kind: 'transaction' as const, id: transactionId }
    if (liveDetails)
      details.setValue(liveDetails.id, { ownerListId: id, content })
    else openDetails({ ownerListId: id, content })
  }

  return (
    <ListDetailsSurface
      active={active}
      title={shown?.title || t('transactions')}
      controller={{ open: !!value, setOpen: open => !open && closeList() }}
      onOpenChangeComplete={open => !open && onExited()}
      details={{
        label: t('transaction'),
        controller: {
          open: !!liveDetails,
          setOpen: open =>
            !open && liveDetails && details.close(liveDetails.id),
        },
        children: shownDetailsId && (
          <TransactionDetails key={shownDetailsId} id={shownDetailsId} />
        ),
      }}
    >
      <TransactionList
        transactionIds={shown?.ids}
        initialDate={
          view.restoredScrollOffset === null ? shown?.initialDate : undefined
        }
        view={view}
        opened={liveDetails?.value.content.id}
        onTrOpen={showTransaction}
        className="grow"
      />
    </ListDetailsSurface>
  )
}

function TransactionDetails({ id }: { id: string }) {
  const pending = usePendingEdit()
  const [value, setValue] = transactionDetails.useInstance(id, pending.finish)
  const { remove } = transactionDetails.use()
  const removeSelf = useCallback(() => remove(id), [id, remove])
  const shownId = useTransactionHandover(value?.content.id, removeSelf)
  const openCounterparty = useOpenCounterpartyTransactions()
  if (!shownId) return null
  return (
    <TransactionPreview
      id={shownId}
      onClose={() => setValue(null)}
      onOpenOther={transactionId =>
        setValue(previous => ({
          ...previous,
          content: { kind: 'transaction', id: transactionId },
        }))
      }
      onPendingEdit={pending.register}
      onOpenCounterparty={openCounterparty}
    />
  )
}

export function useOpenCounterpartyTransactions() {
  const openList = useTransactionDrawer()
  return useCallback(
    (query: core.transactions.TTransactionQuery, title: string) => {
      openList({ initialQuery: query, title })
    },
    [openList]
  )
}

function normalizeListValue(value: TransactionListValue): TransactionListValue {
  return value.envelopeConditions
    ? {
        ...value,
        ...envelopeTransactionsValue({
          ...value,
          envelopeConditions: value.envelopeConditions,
        }),
      }
    : value
}

/** Read old saved envelope entries through the same query and owner as new ones. */
export function envelopeTransactionsValue({
  envelopeConditions,
  ...props
}: EnvTransactionsDrawerProps): TransactionDrawerProps {
  const {
    id,
    month,
    isExact,
    mode = core.transactions.TrFilterMode.Envelope,
  } = envelopeConditions
  return {
    ...props,
    initialQuery: {
      clauses: [
        {
          kind: 'activity',
          envelopeIds: id === 'transferFees' || id === null ? [] : [id],
          scope: isExact ? 'self' : 'tree',
          mode:
            id === 'transferFees'
              ? core.transactions.TrFilterMode.TransferFees
              : mode,
          month,
        },
      ],
    },
  }
}
