import { createSelector } from '@reduxjs/toolkit'
import { isZero } from '6-shared/helpers/money'
import type { ById, ByMonth, TISOMonth } from '6-shared/types'

import type { TSelector } from 'store'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { deepEqual } from '6-shared/helpers/deepEqual'

export type TRenderInfo = {
  id: core.envelopes.TEnvelopeId
  showSelf: boolean
  isDefaultVisible: boolean
  isDefaultExpanded: boolean
  hasVisibleChildren: boolean
  hasChildren: boolean
}

export const getEnvRenderInfo: TSelector<ByMonth<ById<TRenderInfo>>> =
  createSelector(
    [
      core.envelopes.selectAll,
      core.months.selectList,
      core.activity.selectEnvelopeMetrics,
      core.goals.selectAll,
    ],
    (envelopes, monthList, envData, goals) => {
      const result: ByMonth<ById<TRenderInfo>> = {}

      monthList.forEach(month => {
        result[month] = getEnvelopesInfo(month)
      })

      return result

      function getEnvelopesInfo(month: TISOMonth) {
        const metrics = envData[month]
        const goalInfo = goals[month]
        const result: ById<TRenderInfo> = {}

        Object.values(envelopes)
          .filter(e => e.parent)
          .forEach(addInfo)
        Object.values(envelopes)
          .filter(e => !e.parent)
          .forEach(addInfo)

        function addInfo(e: core.envelopes.TPresentedEnvelope) {
          const visibility = e.visibility
          const hasChildren = !!e.children.length
          const hasGoal = !!goalInfo[e.id]?.goal
          const hasBudget = !isZero(metrics[e.id].selfBudgeted)
          const hasActivity = !isZero(metrics[e.id].selfActivity)
          const hasAvailable = !isZero(metrics[e.id].selfAvailable)
          const hasVisibleChildren = e.children.some(
            id => result[id].isDefaultVisible
          )
          const isDefaultVisible =
            visibility === core.envelopes.envelopeVisibility.hidden
              ? false
              : visibility === core.envelopes.envelopeVisibility.visible ||
                hasGoal ||
                hasBudget ||
                hasActivity ||
                hasAvailable ||
                hasVisibleChildren

          const isDefaultExpanded =
            hasChildren &&
            (!isZero(metrics[e.id].childrenLeftover) ||
              !isZero(metrics[e.id].childrenBudgeted) ||
              !isZero(metrics[e.id].childrenSurplus))

          result[e.id] = {
            id: e.id,
            hasChildren,
            hasVisibleChildren,
            isDefaultVisible,
            isDefaultExpanded,
            showSelf: hasChildren && hasActivity,
          }
        }

        return result
      }
    }
  )

export function useEnvRenderInfo(month: TISOMonth): ById<TRenderInfo> {
  return useAppSelector(s => getEnvRenderInfo(s)[month], deepEqual)
}
