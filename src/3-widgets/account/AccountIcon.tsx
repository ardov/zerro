import { useState } from 'react'
import {
  AccountIcon as AccountGlyph,
  CashAccountIcon,
  CardAccountIcon,
  LoanAccountIcon,
  DepositAccountIcon,
  EmoneyAccountIcon,
  DebtAccountIcon,
} from '@/6-shared/ui/Icons'
import { AccountType, type TAccount } from '@/6-shared/types'
import { bankIconById } from '@/6-shared/zenmoney-assets/bankIcons'

const iconByType = {
  [AccountType.Cash]: CashAccountIcon,
  [AccountType.Ccard]: CardAccountIcon,
  [AccountType.Checking]: AccountGlyph,
  [AccountType.Loan]: LoanAccountIcon,
  [AccountType.Deposit]: DepositAccountIcon,
  [AccountType.Emoney]: EmoneyAccountIcon,
  [AccountType.Debt]: DebtAccountIcon,
} satisfies Record<AccountType, typeof AccountGlyph>

/** Bank artwork takes priority; missing or failed assets fall back to the account type. */
export function AccountIcon({
  account,
}: {
  account?: Pick<TAccount, 'company' | 'type'>
}) {
  const [failedUrl, setFailedUrl] = useState<string>()
  const url =
    account?.company == null ? undefined : bankIconById[account.company]
  if (url && url !== failedUrl)
    return (
      <img
        src={url}
        alt=""
        aria-hidden
        width={20}
        height={20}
        className="size-5 shrink-0 object-contain"
        onError={() => setFailedUrl(url)}
      />
    )
  const Glyph =
    account && Object.hasOwn(iconByType, account.type)
      ? iconByType[account.type as AccountType]
      : AccountGlyph
  return <Glyph aria-hidden data-account-type={account?.type} />
}
