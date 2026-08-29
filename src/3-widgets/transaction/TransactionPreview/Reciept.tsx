import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { linkClass } from '6-shared/ui/Link'
import { Collapse } from '6-shared/ui/Collapse'
import { cn } from '6-shared/ui/shadcn/utils'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { useAppTheme } from '6-shared/ui/theme'
import { formatMoney } from '6-shared/helpers/money'
import { formatDate } from '6-shared/helpers/date'
import { parseReceipt } from '6-shared/helpers/receipt'

interface RecieptProps {
  value?: string | null
  className?: string
}

export const Reciept: FC<RecieptProps> = ({ value, className }) => {
  const { t } = useTranslation('reciept')
  const [showMore, setShowMore] = useState(false)
  const theme = useAppTheme()
  if (!value) return null

  const parsed = parseReceipt(value)

  const parsedContent = parsed ? (
    <>
      <Line name={t('sum')} value={formatMoney(parsed.s, 'RUB')} />
      <Line
        name={t('date')}
        value={formatDate(parsed.t, 'dd.MM.yyyy, HH:mm')}
      />

      <div className="mt-auto">
        <Collapse open={!showMore}>
          <button
            type="button"
            // MUI's `component="button"`, which came with a reset so the
            // control reads as text rather than as a control.
            className={`${linkClass} m-0 border-0 bg-transparent p-0 align-middle font-sans type-caption select-none`}
            onClick={() => setShowMore(true)}
          >
            {t('showMore', { ns: 'common' })}
          </button>
        </Collapse>
      </div>

      <Collapse open={showMore}>
        <div>
          <Line name={t('fn')} value={parsed.fn} />
          <Line name={t('i')} value={parsed.i} />
          <Line name={t('fp')} value={parsed.fp} />
        </div>
      </Collapse>
    </>
  ) : (
    <p className="m-0 type-body">{t('unknown')}</p>
  )

  return (
    <div className={cn('surface-card shadow-elevation-1 flex p-4', className)}>
      <div className="flex flex-col">{parsedContent}</div>
      <div className="ml-auto">
        <QRCode
          value={value}
          bgColor={theme.palette.background.paper}
          fgColor={theme.palette.text.primary}
          includeMargin
        />
      </div>
    </div>
  )
}

interface LineProps {
  name: string
  value: string
}

const Line: FC<LineProps> = ({ name, value }) => (
  <div className="mb-2">
    <span className="block type-caption text-muted-foreground">{name}</span>
    <p className="m-0 type-body">{value}</p>
  </div>
)
