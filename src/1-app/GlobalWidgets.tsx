import { TransactionListDrawer } from '3-widgets/global/TransactionListDrawer'
import { TransactionPreviewDrawer } from '3-widgets/global/TransactionPreviewDrawer'
import { EnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'
import { JournalRecoveryNotice } from '3-widgets/JournalRecoveryNotice'
import { HistoryPanel } from '3-widgets/History/HistoryPanel'
import { RestoredOutboxNotice } from '3-widgets/History/RestoredOutboxNotice'
import { PersistenceWarningNotice } from '3-widgets/PersistenceWarningNotice'
import { OutboxRecoveryNotice } from '3-widgets/OutboxRecoveryNotice'
import { SyncProgressDialog } from '3-widgets/SyncProgressDialog'

/** The screens that can be opened from anywhere, and the notices.
 *
 * Popups are not here any more: `ask` builds them at the moment of the
 * question and the overlay host draws them, so there is nothing left to mount
 * in advance. */
export const GlobalWidgets = () => {
  return (
    <>
      <JournalRecoveryNotice />
      <OutboxRecoveryNotice />
      <PersistenceWarningNotice />
      <RestoredOutboxNotice />
      <SyncProgressDialog />

      <HistoryPanel />
      <TransactionListDrawer />
      <EnvTransactionsDrawer />
      <TransactionPreviewDrawer />
    </>
  )
}
