import React, { FC } from 'react'
import EmojiIcon from 'components/EmojiIcon'
import { useSearchParam } from 'helpers/useSearchParam'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { getMerchants } from 'store/data/selectors'
import { getTransactions } from 'store/localData/transactions'
import { getType } from 'store/localData/transactions/helpers'
import './styles.scss'
import { Amount } from 'components/Amount'
import {
  getAccounts,
  getDebtAccountId,
  getPopulatedAccounts,
} from 'store/localData/accounts'
import { Transaction as ITransaction, TransactionType } from 'types'
import { getPopulatedTags, getTags } from 'store/localData/tags'

/**TODO: Доделать новый компонент и перевести список на него. */

type TransactionProps = {
  id: string
  isChecked: boolean
  isInSelectionMode: boolean
  onToggle: (id: string) => void
  onSelectChanged: (date: number) => void
  onFilterByPayee: (date: string) => void
}

export const Transaction: FC<TransactionProps> = props => {
  const {
    id,
    isInSelectionMode,
    isChecked,
    onToggle,
    onFilterByPayee,
    onSelectChanged,
  } = props
  const [opened, setOpened] = useSearchParam('transaction')
  const isOpened = opened === id
  const tr = useSelector((state: RootState) => getTransactions(state)[id])
  const debtId = useSelector(getDebtAccountId)
  const trType = getType(tr, debtId)
  const { deleted, payee, merchant, comment, changed, qrCode, viewed } = tr

  const handleOpen = () => {
    // sendEvent('Transaction: see details')
    setOpened(id)
  }
  const handleSelectSimilar = () => onSelectChanged(changed)

  return (
    <div
      className={[
        'transaction',
        isOpened ? 'opened' : '',
        deleted ? 'deleted' : '',
      ].join(' ')}
      onClick={handleOpen}
      onDoubleClick={handleSelectSimilar}
    >
      <div className="symbol">
        <EmojiIcon
          symbol={'V'}
          showCheckBox={isInSelectionMode}
          checked={isChecked}
          onChange={() => onToggle(id)}
          // color={color}
          size="m"
        />
        {!viewed && <span className="new" />}
        {!!qrCode && <Reciept />}
      </div>

      <div className="content">
        <div className="main-line">
          <Tags className="tags" tr={tr} trType={trType} />
          <Amounts className="amounts" tr={tr} trType={trType} />
        </div>

        <div className="secondary-line">
          <div className="info">
            {!!payee && <Payee payee={payee} merchant={merchant} />}
            {!!comment && <span className="comment">{comment}</span>}
          </div>
          <Accounts className="accounts" tr={tr} trType={trType} />
        </div>
      </div>
    </div>
  )
}

type TrElementProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  tr: ITransaction
  trType: TransactionType
}

const Accounts: FC<TrElementProps> = ({ tr, trType, ...rest }) => {
  if (trType === 'income') return <Account id={tr.incomeAccount} />
  if (trType === 'outcome') return <Account id={tr.outcomeAccount} />
  if (trType === 'transfer')
    return (
      <div {...rest}>
        <Account id={tr.outcomeAccount} />
        <Account id={tr.incomeAccount} />
      </div>
    )
  if (trType === 'outcomeDebt')
    return (
      <div {...rest}>
        <Account id={tr.outcomeAccount} />
        <Payee payee={tr.payee} merchant={tr.merchant} />
      </div>
    )
  if (trType === 'incomeDebt')
    return (
      <div {...rest}>
        <Payee payee={tr.payee} merchant={tr.merchant} />
        <Account id={tr.incomeAccount} />
      </div>
    )
  return null
}

const Amounts: FC<TrElementProps> = ({ tr, trType, ...rest }) => {
  if (trType === 'outcome' || trType === 'outcomeDebt') {
    return (
      <div {...rest}>
        {!!tr.opOutcome && !!tr.opOutcomeInstrument && (
          <Amount
            className="secondary-sum"
            value={tr.opOutcome}
            instrument={tr.opOutcomeInstrument}
          />
        )}
        <Amount
          className="primary-sum"
          value={tr.outcome}
          instrument={tr.outcomeInstrument}
        />
      </div>
    )
  }
  if (trType === 'income' || trType === 'incomeDebt') {
    return (
      <div {...rest}>
        {!!tr.opIncome && !!tr.opIncomeInstrument && (
          <Amount
            className="secondary-sum"
            value={tr.opIncome}
            instrument={tr.opIncomeInstrument}
            sign
          />
        )}
        <Amount
          className="primary-sum"
          value={tr.income}
          instrument={tr.incomeInstrument}
          sign
        />
      </div>
    )
  }
  if (trType === 'transfer') {
    const notEqual =
      tr.income !== tr.outcome || tr.incomeInstrument !== tr.outcomeInstrument
    return (
      <div {...rest}>
        {notEqual && (
          <Amount
            className="primary-sum"
            value={tr.outcome}
            instrument={tr.outcomeInstrument}
            sign
          />
        )}
        <Amount
          className="primary-sum"
          value={tr.income}
          instrument={tr.incomeInstrument}
          sign
        />
      </div>
    )
  }
  return null
}

const Tags: FC<TrElementProps> = ({ tr, trType, ...rest }) => {
  const tags = useSelector(getPopulatedTags)
  if (trType === 'income' || trType === 'outcome') {
    if (!tr.tag) return <div {...rest}>Без категории</div>
    else
      return (
        <div {...rest}>
          {tr.tag.map(id => (
            <span>{tags[id]?.name}</span>
          ))}
        </div>
      )
  }
  if (trType === 'transfer') return <div {...rest}>Перевод</div>
  if (trType === 'outcomeDebt') return <div {...rest}>Долг</div>
  if (trType === 'incomeDebt') return <div {...rest}>Долг</div>
  return null
}

const Reciept: FC = () => (
  <span role="img" aria-label="Чек" className="reciept">
    🧾
  </span>
)
interface PayeeProps {
  payee: string | null
  merchant: string | null
}
const Payee: FC<PayeeProps> = ({ payee, merchant, ...rest }) => {
  const merchants = useSelector(getMerchants)
  if (!payee && !merchant) return null
  let name: string = ''
  if (merchant) name = merchants[merchant]?.title
  return (
    <span className="payee" {...rest}>
      {name || payee}
    </span>
  )
}

interface AccountProps {
  id: string
}
const Account: FC<AccountProps> = ({ id, ...rest }) => {
  const account = useSelector(getAccounts)[id]
  return (
    <span className="account" {...rest}>
      {account.title}
    </span>
  )
}
