import { FC, useCallback, useMemo, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '6-shared/ui/Tooltip'
import { TDateDraft, TFxAmount, TTransaction } from '6-shared/types'
import { PercentBar, PercentBarItem } from '6-shared/ui/PercentBar'

import { envelopeModel, EnvType, TEnvelopeId } from '5-entities/envelope'
import { envId } from '5-entities/envelope/shared/envelopeId'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { DataLine } from '3-widgets/DataLine'
import { Card, TCardProps } from '../shared/Card'
import { TStats, useStats } from '../shared/getFacts'

type TDataNode = {
  parent: string | null
  envelopeId: TEnvelopeId | null
  childIds: string[]
} & PercentBarItem

export const DEFAULT_COLOR = '#ff0000'
export const NO_CATEGORY_COLOR = '#808080'

export const MAX_VISIBLE_NODES = 10

export function OutcomeStatCard({ year, onShowTransactions }: TCardProps) {
  const yearStats = useStats(year)
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })
  const [currency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay('current')
  const [showAll, setShowAll] = useState(false)
  const [showParentOnly, setShowParentOnly] = useState(true)

  const tagsWithOutcome = useMemo(
    () =>
      Object.entries(yearStats.byTag).filter(
        ([_, nodeData]) =>
          nodeData.outcome && Object.keys(nodeData.outcome).length > 0
      ),
    [yearStats]
  )

  const createNodeFromTag = useCreateNodeFromTag(yearStats, toDisplay)
  const createParentGroupedNodes = useParentGroupedNodes(
    tagsWithOutcome,
    createNodeFromTag
  )
  const handleShowTransactions = useHandleShowTransactions(
    yearStats,
    onShowTransactions
  )

  const nodes = useMemo(() => {
    const rawNodes = showParentOnly
      ? createParentGroupedNodes()
      : tagsWithOutcome.map(([id]) => createNodeFromTag(id))

    return rawNodes.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  }, [
    showParentOnly,
    createParentGroupedNodes,
    tagsWithOutcome,
    createNodeFromTag,
  ])

  const totalAmount = toDisplay(yearStats.total.outcome)
  const visibleNodes = showAll ? nodes : nodes.slice(0, MAX_VISIBLE_NODES)
  const hasMoreNodes = nodes.length > MAX_VISIBLE_NODES

  if (!totalAmount || nodes.length === 0) return null

  return (
    <Card>
      <Stack gap={1} mt={1} width="80%">
        <DataLine
          name={t('yearlyExpenses')}
          amount={totalAmount}
          currency={currency}
          onClick={() =>
            onShowTransactions(yearStats.total.outcomeTransactions)
          }
        />

        {!!totalAmount && (
          <PercentBar data={nodes} visibleData={visibleNodes} mt={1} />
        )}

        <CategoryList
          visibleNodes={visibleNodes}
          currency={currency}
          onShowTransactions={handleShowTransactions}
        />

        <Box display="flex" justifyContent="center" gap={2} mt={1}>
          <Tooltip title={t('combineIntoParentCategories')}>
            <Button
              onClick={() => setShowParentOnly(!showParentOnly)}
              size="small"
              color="primary"
              variant={showParentOnly ? 'contained' : 'outlined'}
            >
              {t('parentCategories')}
            </Button>
          </Tooltip>

          {hasMoreNodes && (
            <Button
              onClick={() => setShowAll(!showAll)}
              size="small"
              color="primary"
              variant="outlined"
            >
              {showAll ? t('showLess') : t('showAll', { count: nodes.length })}
            </Button>
          )}
        </Box>
      </Stack>
    </Card>
  )
}

function useCreateNodeFromTag(
  yearStats: TStats,
  toDisplay: (amount: TFxAmount, date?: 'current' | TDateDraft) => number
) {
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })
  const envelopes = envelopeModel.useEnvelopes()

  return useCallback(
    (id: string): TDataNode => {
      const nodeData = yearStats.byTag[id] || {}
      const envelopeId =
        id !== 'null' ? (envId.get(EnvType.Tag, id) as TEnvelopeId) : null
      const envelope = envelopeId ? envelopes[envelopeId] : null
      const parentId = envelope?.parent
        ? envelopes[envelope.parent]?.entityId
        : null

      return {
        id,
        amount: nodeData?.outcome ? toDisplay(nodeData.outcome) : 0,
        color: envelope?.colorDisplay || DEFAULT_COLOR,
        name: envelope?.name || t('unknownCategory'),
        parent: parentId,
        envelopeId,
        childIds: [],
      }
    },
    [yearStats, envelopes, toDisplay, t]
  )
}

function useHandleShowTransactions(
  yearStats: TStats,
  onShowTransactions: (transactions: TTransaction[]) => void
) {
  return useCallback(
    (node: TDataNode) => {
      if (!node.childIds.length) {
        onShowTransactions(yearStats.byTag[node.id]?.outcomeTransactions || [])
        return
      }

      const allTransactions = [
        ...(yearStats.byTag[node.id]?.outcomeTransactions || []),
        ...node.childIds.flatMap(
          childId => yearStats.byTag[childId]?.outcomeTransactions || []
        ),
      ]

      onShowTransactions(allTransactions)
    },
    [onShowTransactions, yearStats]
  )
}

function useParentGroupedNodes(
  tagsWithOutcome: [string, any][],
  createNodeFromTag: (id: string) => TDataNode
) {
  const { t } = useTranslation('budgets', { keyPrefix: 'activityStats' })

  return useCallback(() => {
    const parentSums = new Map<string | null, number>()
    const parentNodes = new Map<string | null, TDataNode>()
    const childrenMap = new Map<string | null, string[]>()

    tagsWithOutcome.forEach(([id]) => {
      const node = createNodeFromTag(id)
      const parentId = node.parent || node.id

      if (node.parent) {
        childrenMap.set(parentId, [...(childrenMap.get(parentId) || []), id])
      }

      parentSums.set(parentId, (parentSums.get(parentId) || 0) + node.amount)

      if (parentNodes.has(parentId)) {
        return
      }

      if (parentId === id || !node.parent) {
        parentNodes.set(parentId, {
          ...node,
          id: parentId,
          amount: 0,
          parent: null,
        })
      } else {
        parentNodes.set(parentId, createNodeFromTag(parentId))
      }
    })

    return Array.from(parentSums.entries()).map(([parentId, amount]) => {
      if (!parentId) {
        return {
          id: 'noParent',
          amount,
          color: NO_CATEGORY_COLOR,
          name: t('noCategory'),
          parent: null,
          envelopeId: null,
          childIds: childrenMap.get(parentId) || [],
        }
      }

      const parentNode = parentNodes.get(parentId)
      if (parentNode) {
        return {
          ...parentNode,
          amount,
          childIds: childrenMap.get(parentId) || [],
        }
      }

      return createNodeFromTag(parentId)
    })
  }, [tagsWithOutcome, t, createNodeFromTag])
}

interface CategoryListProps {
  visibleNodes: TDataNode[]
  currency: string
  onShowTransactions: (node: TDataNode) => void
}

const CategoryList: FC<CategoryListProps> = ({
  visibleNodes,
  currency,
  onShowTransactions,
}) => {
  return (
    <Stack gap={1.5} mt={2}>
      {visibleNodes.map(point => (
        <DataLine
          key={point.id}
          name={point.name}
          amount={point.amount}
          color={point.color}
          currency={currency}
          onClick={() => onShowTransactions(point)}
        />
      ))}
    </Stack>
  )
}
