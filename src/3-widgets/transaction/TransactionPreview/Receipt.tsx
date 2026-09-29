import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/6-shared/ui/kit/Button'
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
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 text-ui-14"
            onClick={() => setShowMore(true)}
          >
            {t('showMore', { ns: 'common' })}
          </Button>
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
    <p className="m-0 text-ui-16">{t('unknown')}</p>
  )

  return (
    <div
      className={cn(
        'rounded-ui-control rounded-smooth bg-ui-highlight text-ui-primary flex p-4',
        className
      )}
    >
      <div className="flex flex-col">{parsedContent}</div>
      <div className="ml-auto">
        <QRCode
          value={value}
          bgColor="var(--color-ui-card)"
          fgColor="var(--color-ui-primary)"
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
    <span className="block text-ui-14 text-ui-secondary">{name}</span>
    <p className="m-0 text-ui-16">{value}</p>
  </div>
)
