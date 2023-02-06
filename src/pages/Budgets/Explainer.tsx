import { useCallback } from 'react'
import Balancer from 'react-wrap-balancer'
import { Card, IconButton, Link, Stack, Typography } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { sendEvent } from '@shared/helpers/tracking'
import { CloseIcon } from '@shared/ui/Icons'
import { useSnackbar } from '@shared/ui/SnackbarProvider'
import { Tooltip } from '@shared/ui/Tooltip'

import { useAppDispatch, useAppSelector } from '@store/index'
import { getAccTagMap } from '@entities/old-hiddenData/accTagMap'
import { getGoals } from '@entities/old-hiddenData/goals'
import { getTagMeta } from '@entities/old-hiddenData/tagMeta'
import { userSettingsModel } from '@entities/userSettings'
import { convertZmBudgetsToZerro } from '@features/budget/convertZmBudgetsToZerro'

export const Explainer = () => {
  const dispatch = useAppDispatch()
  const setSnackbar = useSnackbar()
  const { markSeen, isHidden, usedOldFeatures } = useExplainerModel()

  const convertBudgets = useCallback(() => {
    sendEvent('Migration: convert_budgets')
    const updated = dispatch(convertZmBudgetsToZerro())
    setSnackbar({ message: `✅ Бюджеты сконвертированы (${updated.length})` })
  }, [dispatch, setSnackbar])

  if (isHidden) return null

  return (
    <Card sx={{ p: 2 }}>
      <Stack
        spacing={2}
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
      >
        <Typography variant="h5">🎉</Typography>
        <Stack spacing={1} flexGrow={1}>
          <Typography>
            <Balancer>
              <b>Куда пропали бюджеты?</b>
            </Balancer>
          </Typography>

          <Typography>
            <Balancer>
              Привет! Zerro обновился, у него теперь свои, независимые
              от Дзен-мани, бюджеты. Сконвертируйте старые бюджеты в новые.
            </Balancer>
          </Typography>

          {usedOldFeatures && (
            <Typography>
              <Balancer>
                Несколько старых функций пришлось сломать ради
                ✨светлого будущего✨. Поэтому бюджеты могут поплыть,
                и исправлять это придётся вручную.
              </Balancer>
            </Typography>
          )}

          <Stack direction="row" flexWrap="wrap" rowGap={1} columnGap={2}>
            <Tooltip title="Бюджеты из Дзен-мани скопируются в Zerro. Изменения бюджетов в Zerro не будут влиять на бюджеты в ДМ.">
              <Link
                component="button"
                variant="body1"
                color="secondary"
                onClick={convertBudgets}
              >
                Конвертировать бюджеты
              </Link>
            </Tooltip>
            <Link
              href="https://www.notion.so/zerro/Zerro-v1-2023-ffdc46871b3d4581868fd005e2c2a0f5"
              color="secondary"
              target="_blank"
              onClick={() => sendEvent('Migration: whats_new')}
            >
              Что изменилось?
            </Link>
            <Link
              href="https://old.zerro.app"
              color="secondary"
              onClick={() => sendEvent('Migration: old_version')}
            >
              Старая версия
            </Link>
          </Stack>
        </Stack>

        <Tooltip title="Скрыть это сообщение">
          <IconButton onClick={markSeen}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Card>
  )
}

const HIDE_DATE = '2023-02-25'

function useExplainerModel() {
  const dispatch = useAppDispatch()
  const oldLinks = useAppSelector(s => keys(getAccTagMap(s)).length)
  const oldGoals = useAppSelector(s => keys(getGoals(s)).length)
  const oldTagMeta = useAppSelector(s => keys(getTagMeta(s)).length)
  const sawMigrationAlert = useAppSelector(
    s => !!userSettingsModel.get(s).sawMigrationAlert
  )
  const markSeen = () => {
    sendEvent('Migration: close')
    dispatch(userSettingsModel.patch({ sawMigrationAlert: true }))
  }
  const hasOldData = Boolean(oldLinks || oldGoals || oldTagMeta)

  return {
    markSeen,
    isHidden: sawMigrationAlert || new Date().toISOString() > HIDE_DATE,
    usedOldFeatures: hasOldData,
  }
}
