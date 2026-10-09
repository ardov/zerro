import {
  AccountIcon,
  CategoryIcon,
  PlaceIcon,
  SyncAltIcon,
  AccountBalanceWalletIcon,
  CalendarIcon,
  HistoryIcon,
  AutoAwesomeIcon,
  DeleteIcon,
} from '@/6-shared/ui/Icons'
import type { AddableFilterKind } from './filterModel'

const icons = {
  account: AccountIcon,
  tag: CategoryIcon,
  merchant: PlaceIcon,
  type: SyncAltIcon,
  amount: AccountBalanceWalletIcon,
  date: CalendarIcon,
  changed: HistoryIcon,
  viewed: AutoAwesomeIcon,
  deleted: DeleteIcon,
} satisfies Record<AddableFilterKind, typeof CalendarIcon>

export function FilterIcon({ kind }: { kind: AddableFilterKind }) {
  const Icon = icons[kind]
  return <Icon />
}
