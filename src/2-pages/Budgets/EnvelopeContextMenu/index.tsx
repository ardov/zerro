import React, { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { TISOMonth } from '6-shared/types'
import { registerPopover } from '6-shared/historyPopovers'
import { TEnvelopeId } from '5-entities/envelope'
import { TrFilterMode } from '5-entities/envBalances'
import { getMenuPosition } from '3-widgets/global/shared/helpers'
import { useEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'
import { useBudgetPopover } from '../BudgetPopover'

type ExtraProps = {
  id: TEnvelopeId
  month: TISOMonth
  isExact?: boolean
}

const envCtx = registerPopover<ExtraProps, MenuProps>(
  'envelopeContextMenu',
  { id: '' as TEnvelopeId, month: '' as TISOMonth }
)

export const useEnvelopeContextMenu = () => {
  const { open } = envCtx.useMethods()
  return useCallback(
    (
      args: ExtraProps,
      anchorPosition?: { left: number; top: number }
    ) => open(args, getMenuPosition(anchorPosition)),
    [open]
  )
}

export const SmartEnvelopeContextMenu: FC = () => {
  const { t } = useTranslation('common')
  const history = useHistory()
  const popover = envCtx.useProps()
  const { id, month, isExact } = popover.extraProps
  const openBudget = useBudgetPopover()
  const trDrawer = useEnvTransactionsDrawer()

  const closeAndThen = useCallback(
    (action: () => void) => {
      const unlisten = history.listen(() => {
        unlisten()
        action()
      })
      popover.close()
    },
    [history, popover]
  )

  return (
    <Menu {...popover.displayProps}>
      <MenuItem
        onClick={() => closeAndThen(() => openBudget(id))}
      >
        {t('budget')}
      </MenuItem>
      <MenuItem
        onClick={() =>
          closeAndThen(() =>
            trDrawer.open({
              envelopeConditions: {
                id,
                month,
                mode: TrFilterMode.Envelope,
                isExact,
              },
            })
          )
        }
      >
        {t('activity')}
      </MenuItem>
    </Menu>
  )
}
