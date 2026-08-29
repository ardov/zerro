import { useTranslation } from 'react-i18next'
import { SideDrawer } from '6-shared/ui/SideDrawer'
import { registerPopover } from '6-shared/historyPopovers'
import type { TTransactionId } from '6-shared/types'
import type { TransactionPreviewProps } from '../transaction/TransactionPreview'
import { TransactionPreview } from '../transaction/TransactionPreview'

export type TransactionPreviewDrawerProps = {
  id: TTransactionId
  onOpenOther?: TransactionPreviewProps['onOpenOther']
  onSelectSimilar?: TransactionPreviewProps['onSelectSimilar']
}

const trDrawerHooks = registerPopover('transaction-preview-drawer', {
  id: '',
} as TransactionPreviewDrawerProps)

export const useTransactionPreview = trDrawerHooks.useMethods

export const SmartTransactionPreview = () => {
  const { t } = useTranslation('common')
  const drawer = trDrawerHooks.useProps()
  const { id, onOpenOther = () => {}, onSelectSimilar } = drawer.extraProps
  const { onClose, open } = drawer.displayProps
  return (
    <SideDrawer
      onClose={onClose}
      open={open}
      // legacy UI sized the paper through `sx`; the sheet takes it as a class.
      className="w-screen sm:w-[360px]"
      aria-label={t('transaction')}
    >
      <div className="flex h-screen min-w-80 flex-col">
        <TransactionPreview
          id={id}
          onClose={onClose}
          onOpenOther={onOpenOther}
          onSelectSimilar={onSelectSimilar}
        />
      </div>
    </SideDrawer>
  )
}
