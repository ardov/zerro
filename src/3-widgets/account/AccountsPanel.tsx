import { Panel } from '@/6-shared/ui/layout/Panel'
import { panelWidths } from '@/6-shared/ui/layout/panelWidths'
import { DebtorList } from '@/3-widgets/DebtorList'
import AccountList from './AccountList'

export function AccountsPanel() {
  return (
    <Panel
      className="shrink-0"
      style={{ width: panelWidths.accounts }}
      contentClassName="px-1 py-2"
    >
      <AccountList />
      <DebtorList />
    </Panel>
  )
}
