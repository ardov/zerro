import { PanelScrollable } from '@/6-shared/ui/layout/Panel'
import { DebtorList } from '@/3-widgets/DebtorList'
import AccountList from './AccountList'

export function AccountsPanel() {
  return (
    <PanelScrollable contentClassName="px-1 py-2">
      <AccountList />
      <DebtorList />
    </PanelScrollable>
  )
}
