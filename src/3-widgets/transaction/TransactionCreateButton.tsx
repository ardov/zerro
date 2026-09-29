import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePopup } from '@/6-shared/overlays'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { AddIcon } from '@/6-shared/ui/Icons'
import { TransactionCreate } from './TransactionPreview'
import type { core } from '@/zerro-core/redux'

export function TransactionCreateButton({
  query = { clauses: [] },
}: {
  query?: core.transactions.TTransactionQuery
}) {
  const [started, setStarted] = useState(false)
  const { t } = useTranslation('transaction')
  const { open, setOpen } = usePopup()
  const close = () => setOpen(false)
  return (
    <>
      <IconButton
        label={t('newTransaction')}
        variant="ghost"
        size="sm"
        onClick={() => {
          setStarted(true)
          setOpen(true)
        }}
      >
        <AddIcon />
      </IconButton>
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
