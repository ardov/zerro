import { Button } from '@/6-shared/ui/kit/Button'
import type { FC } from 'react'
import { core } from '@/zerro-core/redux'

import { useTranslation } from 'react-i18next'
import type { TISOMonth } from '@/6-shared/types'
import { WarningIcon } from '@/6-shared/ui/Icons'
import { isZero } from '@/6-shared/helpers/money'
import { useAsk } from '@/6-shared/overlays'
import { Confirm } from '@/6-shared/ui/kit/Confirm'
import { useAppDispatch, useAppSelector } from '@/store'
import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import { track } from '@/6-shared/analytics'

export const OverspendNotice: FC<{ month: TISOMonth }> = ({ month }) => {
  const { t } = useTranslation('overspendNotice')
  const dispatch = useAppDispatch()
  const { overspend } = useAppSelector(core.months.selectTotals)[month]
  const ask = useAsk()
  const fixOverspends = async () => {
    const confirmed = await ask(
      <Confirm
        title={t('confirm.title')}
        okText={t('confirm.okText')}
        cancelText={t('confirm.cancelText')}
      />
    )
    if (!confirmed) return
    if (dispatch(core.budgets.coverOverspending(month)).status === 'applied') {
      track('budget_automation_applied', { automation: 'fix_overspends' })
    }
  }

  if (isZero(overspend)) return null

  return (
    <div className="flex flex-row rounded-lg bg-ui-base p-4">
      <div className="shrink-0 pt-[2px] text-ui-warning">
        <WarningIcon />
      </div>
      <div className="ml-3">
        <p className="m-0 text-body font-medium">
          {t('title')}{' '}
          <DisplayAmount
            value={overspend}
            month={month}
            noShade
            sign={false}
            decimals="ifAny"
          />
          .
        </p>
        <p className="m-0 text-body-sm">{t('description')}</p>

        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mt-2"
          onClick={fixOverspends}
        >
          {t('btn')}
        </Button>
      </div>
    </div>
  )
}
