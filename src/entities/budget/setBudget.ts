import { envelopeModel } from '@entities/envelope'
import { userSettingsModel } from '@entities/userSettings'
import { DataEntity } from '@shared/types'
import { AppThunk } from '@store/index'
import { setEnvBudget, TEnvBudgetUpdate } from './envBudget'
import { setTagBudget, TTagBudgetUpdate } from './tagBudget'

export type TBudgetUpdate = TEnvBudgetUpdate

export function setBudget(upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk {
  return (dispatch, getState) => {
    const { preferZmBudgets } = userSettingsModel.get(getState())
    const updates = Array.isArray(upd) ? upd : [upd]

    let tagUpdates: TTagBudgetUpdate[] = []
    let envUpdates: TEnvBudgetUpdate[] = []

    updates.forEach(update => {
      const { type, id } = envelopeModel.parseId(update.id)
      if (type === DataEntity.Tag && preferZmBudgets) {
        tagUpdates.push({ tag: id, month: update.month, value: update.value })
      } else {
        envUpdates.push(update)
      }
    })

    dispatch(setTagBudget(tagUpdates))
    dispatch(setEnvBudget(envUpdates))
  }
}
