import { getAccTagMap } from '@entities/old-hiddenData/accTagMap'
import { getGoals } from '@entities/old-hiddenData/goals'
import { getTagMeta } from '@entities/old-hiddenData/tagMeta'
import { userSettingsModel } from '@entities/userSettings'
import { Card, IconButton, Link, Stack, Typography } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { sendEvent } from '@shared/helpers/tracking'
import { CloseIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'
import { useAppDispatch, useAppSelector } from '@store/index'
import Balancer from 'react-wrap-balancer'

export const Explainer = () => {
  const { markSeen, isHidden, usedOldFeatures } = useExplainerModel()
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
              <b>Zerro обновился и стал умнее</b>
            </Balancer>
          </Typography>

          <Typography>
            <Balancer>
              У Zerro теперь свои, независимые от Дзен-мани бюджеты. Это можно
              изменить в настройках + там же можно сконвертировать старые
              бюджеты в новые.
            </Balancer>
          </Typography>

          {usedOldFeatures && (
            <Typography>
              <Balancer>
                Несколько старых функций пришлось сломать ради светлого
                будущего. Поэтому бюджеты могут поплыть, и исправлять это
                придётся вручную.
              </Balancer>
            </Typography>
          )}

          <Stack direction="row" flexWrap="wrap" rowGap={1} columnGap={2}>
            <Link
              href="https://t.me/zerroapp"
              color="secondary"
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
    isHidden: sawMigrationAlert,
    usedOldFeatures: hasOldData,
  }
}
