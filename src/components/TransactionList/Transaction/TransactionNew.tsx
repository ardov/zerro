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

/**TODO: Доделать новый компонент и перевести список на него. */

type TransactionProps = {
  id: string
  isOpened: boolean
  isChecked: boolean
  isInSelectionMode: boolean
  onToggle: (id: string) => void
  onClick?: (id: string) => void
  onSelectChanged: (date: number) => void
  onFilterByPayee: (date: string) => void
}

export const Transaction: FC<TransactionProps> = ({
  id,
  // isOpened,
  isInSelectionMode,
  isChecked,
  onToggle,
  onClick,
  onFilterByPayee,
  onSelectChanged,
}) => {
  const [opened, setOpened] = useSearchParam('transaction')
  const isOpened = opened === id
  const tr = useSelector((state: RootState) => getTransactions(state)[id])
  const debtId = useSelector(getDebtAccountId)
  const {
    deleted,
    payee,
    merchant,
    comment,
    income,
    opIncome,
    opOutcomeInstrument,
    outcome,
    outcomeInstrument,
    opOutcome,
    changed,
    qrCode,
    viewed,
  } = tr
  const trType = getType(tr, debtId)

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
      // selected={isOpened}
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
          <span className="tags">
            <Tags tr={tr} trType={trType} />
          </span>

          <div className="amounts">
            {(trType === 'income' || trType === 'incomeDebt') && (
              <>
                {!!opOutcome && !!opOutcomeInstrument && (
                  <span className="secondary-sum">
                    <Amount
                      value={opOutcome}
                      instrument={opOutcomeInstrument}
                    />
                  </span>
                )}
                <span className="primary-sum">
                  <Amount value={outcome} instrument={outcomeInstrument} />
                </span>
              </>
            )}
            {!!opOutcome && !!opOutcomeInstrument && (
              <span className="secondary-sum">
                <Amount value={opOutcome} instrument={opOutcomeInstrument} />
              </span>
            )}
            <span className="primary-sum">
              <Amount value={outcome} instrument={outcomeInstrument} />
            </span>
          </div>
        </div>

        <div className="secondary-line">
          <div className="info">
            {!!payee && <Payee payee={payee} merchant={merchant} />}
            {!!comment && <span className="comment">{comment}</span>}
          </div>

          <div className="accounts">
            <Accounts tr={tr} trType={trType} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface TrElementProps {
  tr: ITransaction
  trType: TransactionType
}
const Accounts: FC<TrElementProps> = ({ tr, trType }) => {
  if (trType === 'income') return <Account id={tr.incomeAccount} />
  if (trType === 'outcome') return <Account id={tr.outcomeAccount} />
  if (trType === 'transfer')
    return (
      <>
        <Account id={tr.outcomeAccount} />
        <Account id={tr.incomeAccount} />
      </>
    )
  if (trType === 'outcomeDebt')
    return (
      <>
        <Account id={tr.outcomeAccount} />
        <Payee payee={tr.payee} merchant={tr.merchant} />
      </>
    )
  if (trType === 'incomeDebt')
    return (
      <>
        <Payee payee={tr.payee} merchant={tr.merchant} />
        <Account id={tr.incomeAccount} />
      </>
    )
  return null
}
const Tags: FC<TrElementProps> = ({ tr, trType }) => {
  if (trType === 'income' || trType === 'outcome') {
    if (!tr.tag) return <>Без категории</>
    else
      return (
        <>
          {tr.tag.map(tagId => (
            <span>123</span>
          ))}
        </>
      )
  }
  if (trType === 'transfer') return <>Перевод</>
  if (trType === 'outcomeDebt') return <>Долг</>
  if (trType === 'incomeDebt') return <>Долг</>
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
