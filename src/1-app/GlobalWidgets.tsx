import { SmartConfirm } from '6-shared/ui/SmartConfirm'
import { SmartTransactionListDrawer } from '3-widgets/global/TransactionListDrawer'
import { SmartTransactionPreview } from '3-widgets/global/TransactionPreviewDrawer'
import { TrContextMenu } from '3-widgets/global/TrContextMenu'
import { AccountContextMenu } from '3-widgets/global/AccountContextMenu'
import { SmartEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'
import { JournalRecoveryNotice } from '3-widgets/JournalRecoveryNotice'
import { HistoryPanel } from '3-widgets/History/HistoryPanel'
import { RestoredOutboxNotice } from '3-widgets/History/RestoredOutboxNotice'
import { PersistenceWarningNotice } from '3-widgets/PersistenceWarningNotice'
import { OutboxRecoveryNotice } from '3-widgets/OutboxRecoveryNotice'

export const GlobalWidgets = () => {
  return (
    <>
      {/* Global confirm */}
      <SmartConfirm />
      <JournalRecoveryNotice />
      <OutboxRecoveryNotice />
      <PersistenceWarningNotice />
      <RestoredOutboxNotice />
      <HistoryPanel />

      {/* Global widgets */}
      <SmartTransactionListDrawer />
      <SmartEnvTransactionsDrawer />
      <SmartTransactionPreview />
      <TrContextMenu />
      <AccountContextMenu />
    </>
  )
}
