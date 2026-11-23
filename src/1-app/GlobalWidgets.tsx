import { TransactionListDrawer } from '@/3-widgets/global/TransactionListDrawer'
import { TransactionPreviewDrawer } from '@/3-widgets/global/TransactionPreviewDrawer'
import { JournalRecoveryNotice } from '@/3-widgets/JournalRecoveryNotice'
import { HistoryPanel } from '@/3-widgets/History/HistoryPanel'
import { PersistenceWarningNotice } from '@/3-widgets/PersistenceWarningNotice'
import { OutboxRecoveryNotice } from '@/3-widgets/OutboxRecoveryNotice'
import { SyncProgressDialog } from '@/3-widgets/SyncProgressDialog'
import { ZerroDataAccountNotice } from '@/3-widgets/ZerroDataAccountNotice'
import { SettingsScreen } from '@/3-widgets/Navigation/SettingsScreen'

export const GlobalWidgets = () => {
  return (
    <>
      <JournalRecoveryNotice />
      <OutboxRecoveryNotice />
      <PersistenceWarningNotice />
      <SyncProgressDialog />
      <ZerroDataAccountNotice />

      <SettingsScreen />
      <HistoryPanel />
      <TransactionPreviewDrawer />
      <TransactionListDrawer />
    </>
  )
}
