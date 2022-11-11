import { createSelector } from '@reduxjs/toolkit'
import { isZero } from '@shared/helpers/money'
import { ById, ByMonth, TEnvelopeId, TISOMonth } from '@shared/types'

import { TSelector, useAppSelector } from '@store'
import { envelopeVisibility, getEnvelopes, TEnvelope } from '@entities/envelope'
import { balances } from '@entities/envBalances'
import { goalModel } from '@entities/goal'
import { isEqual } from 'lodash'

export type TRenderInfo = {
  id: TEnvelopeId
  showSelf: boolean
  isDefaultVisible: boolean
  isDefaultExpanded: boolean
  hasVisibleChildren: boolean
  hasChildren: boolean
}

export const getEnvRenderInfo: TSelector<ByMonth<ById<TRenderInfo>>> =
  createSelector(
    [getEnvelopes, balances.monthList, balances.envData, goalModel.get],
    (envelopes, monthList, envData, goals) => {
      const result: ByMonth<ById<TRenderInfo>> = {}

      monthList.forEach(month => {
        result[month] = getEnvelopesInfo(month)
      })

      return result

      function getEnvelopesInfo(month: TISOMonth) {
        const metrics = envData[month]
        const goalInfo = goals[month]
        let result: ById<TRenderInfo> = {}

        Object.values(envelopes)
          .filter(e => e.parent)
          .forEach(addInfo)
        Object.values(envelopes)
          .filter(e => !e.parent)
          .forEach(addInfo)

        function addInfo(e: TEnvelope) {
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
            visibility === envelopeVisibility.hidden
              ? false
              : visibility === envelopeVisibility.visible ||
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
  return useAppSelector(s => getEnvRenderInfo(s)[month], isEqual)
}
