import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePopup } from '@/6-shared/overlays'
import { IconButton } from '@/6-shared/ui/Button'
import { AddIcon } from '@/6-shared/ui/Icons'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { TransactionCreate } from './TransactionPreview'
import type { core } from '@/zerro-core/redux'

export function TransactionCreateButton({
  query = { clauses: [] },
}: {
  query?: core.transactions.TTransactionQuery
}) {
  const [started, setStarted] = useState(false)
  const { t } = useTranslation('transaction')
  const [open, setOpen] = usePopup()
  const close = () => setOpen(false)
  return (
    <>
      <Tooltip title={t('newTransaction')}>
        <IconButton
          aria-label={t('newTransaction')}
          onClick={() => {
            setStarted(true)
            setOpen(true)
          }}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
      {started && (
        <TransactionCreate
          open={open}
          onClose={close}
          query={query}
          onCreated={() => {
            close()
            setStarted(false)
          }}
        />
      )}
    </>
  )
}
