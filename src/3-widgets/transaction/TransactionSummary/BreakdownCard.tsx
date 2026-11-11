import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFxCode } from '@/6-shared/types'
import { Collapse } from '@/6-shared/ui/kit/Collapse'
import { PercentBar, type PercentBarItem } from '@/6-shared/ui/PercentBar'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { DataLine } from '@/3-widgets/DataLine'
import { InlineButton, cycle } from './shared'
import {
  getBreakdown,
  type TDimension,
  type TEntry,
  type TGroup,
} from './model'

type Clause = core.transactions.TTransactionFilterClause
type TNode = PercentBarItem & { clause?: Clause }

/** How many groups are named before the rest fold into one line. */
const TOP = 5
const REST_COLOR = '#808080'

/** What one side is made of, along whichever dimension splits it. Whether to
 * show the card is its owner's call; it draws a single group just as well. */
export function BreakdownCard(props: {
  entries: readonly TEntry[]
  /** Dimensions on offer. They are the same for either side. */
  dimensions: readonly TDimension[]
  currency: TFxCode
  /** The side's name, or the control that switches it. */
  side: ReactNode
  /** Narrows the list to one group. Absent where there is no filter to narrow. */
  onFilter?: (clause: Clause) => void
}) {
  const { entries, dimensions: available, currency, side, onFilter } = props
  const { t } = useTranslation('transactionSummary')
  const [chosen, setChosen] = useState<TDimension>('category')
  const [expanded, setExpanded] = useState(false)
  const describe = useGroupDescriptions()
  // A filter can take the chosen dimension off the offer; fall back quietly.
  // With nothing on offer there is still one group to name, by category.
  const dimension = available.includes(chosen)
    ? chosen
    : (available[0] ?? 'category')

  const nodes: TNode[] = getBreakdown(entries, dimension).map(group => ({
    id: group.key,
    amount: group.value,
    ...describe(group, dimension),
  }))
  const top = nodes.slice(0, TOP)
  const rest = nodes.slice(TOP)
  const restNode: TNode | undefined = rest.length
    ? {
        id: 'rest',
        name: t('more', { count: rest.length }),
        color: REST_COLOR,
        amount: rest.reduce((total, node) => total + node.amount, 0),
      }
    : undefined

  const line = (node: TNode) => (
    <DataLine
      key={node.id}
      name={node.name}
      amount={node.amount}
      color={node.color}
      currency={currency}
      className={node.clause && onFilter ? 'cursor-pointer' : undefined}
      onClick={
        node.clause && onFilter ? () => onFilter(node.clause!) : undefined
      }
    />
  )

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-ui-base p-4">
      <p className="m-0 text-body">
        {side} {t('by')}{' '}
        {available.length > 1 ? (
          <InlineButton
            onClick={() => {
              setChosen(cycle(available, dimension))
              setExpanded(false)
            }}
          >
            {t(`dimension_${dimension}`)}
          </InlineButton>
        ) : (
          t(`dimension_${dimension}`)
        )}
      </p>
      <PercentBar data={expanded || !restNode ? nodes : [...top, restNode]} />
      <div className="flex flex-col gap-3">
        {top.map(line)}
        {restNode && !expanded && (
          <DataLine
            name={restNode.name}
            amount={restNode.amount}
            color={restNode.color}
            currency={currency}
            className="cursor-pointer text-ui-secondary"
            onClick={() => setExpanded(true)}
          />
        )}
      </div>
      {restNode && (
        <Collapse open={expanded}>
          <div className="flex flex-col gap-3">{rest.map(line)}</div>
        </Collapse>
      )}
    </div>
  )
}

/** Names, colors and the filter that selects exactly one group. A place known
 * only by its typed payee has no exact filter, so it is not clickable. */
function useGroupDescriptions() {
  const { t } = useTranslation('transactionSummary')
  const tags = useAppSelector(core.tags.selectPopulated)
  const merchants = core.merchants.useAll()
  const accounts = core.accounts.usePopulated()
  return (
    group: TGroup,
    dimension: TDimension
  ): { name: string; color: string; clause?: Clause } => {
    const generated = (name: string) => ({
      name,
      color: core.tags.getColorForString(name),
    })
    switch (dimension) {
      case 'category': {
        const tag = tags[group.key]
        return {
          name: tag?.name ?? t('unknown'),
          color: tag?.colorDisplay ?? REST_COLOR,
          clause: { kind: 'tag', ids: [group.key] },
        }
      }
      case 'place': {
        if (group.key.startsWith('m:')) {
          const id = group.key.slice(2)
          return {
            ...generated(merchants[id]?.title ?? t('unknown')),
            clause: { kind: 'merchant', ids: [id] },
          }
        }
        const payee = group.sample.payee?.trim()
        return payee
          ? generated(payee)
          : { name: t('noPlace'), color: REST_COLOR }
      }
      case 'account':
        return {
          ...generated(accounts[group.key]?.title ?? t('unknown')),
          clause: group.key ? { kind: 'account', ids: [group.key] } : undefined,
        }
      case 'currency':
        return {
          ...generated(group.key),
          clause: { kind: 'amount', currencies: [group.key] },
        }
    }
  }
}
