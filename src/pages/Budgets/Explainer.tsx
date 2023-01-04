import { getAccTagMap } from '@entities/old-hiddenData/accTagMap'
import { getGoals } from '@entities/old-hiddenData/goals'
import { getTagMeta } from '@entities/old-hiddenData/tagMeta'
import { userSettingsModel } from '@entities/userSettings'
import { Card, IconButton, Link, Stack, Typography } from '@mui/material'
import { keys } from '@shared/helpers/keys'
import { CloseIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'
import { useAppDispatch, useAppSelector } from '@store/index'
import Balancer from 'react-wrap-balancer'

export const Explainer = () => {
  const { markSeen, isVisible } = useExplainerModel()
  if (!isVisible) return null

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
          <Typography variant="body1">
            <Balancer>
              <b>Zerro обновился и стал умнее</b>
              <br />
              Ради этого пришлось сломать несколько старых настроек. Поэтому
              могут поплыть бюджеты, и исправлять это придётся вручную.
            </Balancer>
          </Typography>
          <Stack direction="row" flexWrap="wrap" rowGap={1} columnGap={2}>
            <Link href="https://t.me/zerroapp" color="secondary">
              Что изменилось?
            </Link>
            <Link href="https://old.zerro.app" color="secondary">
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
    s => !!userSettingsModel.getUserSettings(s).sawMigrationAlert
  )
  const markSeen = () => {
    dispatch(userSettingsModel.patchUserSettings({ sawMigrationAlert: true }))
  }
  const hasOldData = Boolean(oldLinks || oldGoals || oldTagMeta)

  return { markSeen, isVisible: hasOldData && !sawMigrationAlert }
}
