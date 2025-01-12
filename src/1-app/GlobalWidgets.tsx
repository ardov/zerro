import React from 'react'
import { SmartConfirm } from '6-shared/ui/SmartConfirm'
import { SmartTransactionListDrawer } from '3-widgets/global/TransactionListDrawer'
import { SmartTransactionPreview } from '3-widgets/global/TransactionPreviewDrawer'
import { TrContextMenu } from '3-widgets/global/TrContextMenu'
import { AccountContextMenu } from '3-widgets/global/AccountContextMenu'
import { SmartEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'

export const GlobalWidgets = () => {
  return (
    <>
      {/* Global confirm */}
      <SmartConfirm />

      {/* Global widgets */}
      <SmartTransactionListDrawer />
      <SmartEnvTransactionsDrawer />
      <SmartTransactionPreview />
      <TrContextMenu />
      <AccountContextMenu />
    </>
  )
}
