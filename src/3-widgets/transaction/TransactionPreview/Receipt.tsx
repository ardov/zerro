import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { linkClass } from '@/6-shared/ui/Link'
import { Collapse } from '@/6-shared/ui/Collapse'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { formatMoney } from '@/6-shared/helpers/money'
import { formatDate } from '@/6-shared/helpers/date'
import { parseReceipt } from '@/6-shared/helpers/receipt'

interface ReceiptProps {
  value?: string | null
  className?: string
}

export const Receipt: FC<ReceiptProps> = ({ value, className }) => {
  const { t } = useTranslation('receipt')
  const [showMore, setShowMore] = useState(false)
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
            // Reset the native button so the control reads visually as text.
            className={`${linkClass} m-0 border-0 bg-transparent p-0 align-middle font-sans text-caption select-none`}
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
    <p className="m-0 text-body">{t('unknown')}</p>
  )

  return (
    <div
      className={cn(
        'rounded-lg bg-card text-card-foreground shadow-elevation-1 flex p-4',
        className
      )}
    >
      <div className="flex flex-col">{parsedContent}</div>
      <div className="ml-auto">
        <QRCode
          value={value}
          bgColor="var(--card)"
          fgColor="var(--foreground)"
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
    <span className="block text-caption text-muted-foreground">{name}</span>
    <p className="m-0 text-body">{value}</p>
  </div>
)
