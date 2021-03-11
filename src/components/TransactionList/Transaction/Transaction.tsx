import React, { FC } from 'react'
import EmojiIcon from 'components/EmojiIcon'
import { useSearchParam } from 'helpers/useSearchParam'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { getMerchants } from 'store/data/selectors'
import { getTransactions } from 'store/localData/transactions'
import { getType } from 'store/localData/transactions/helpers'
import './styles.scss'

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
  const {
    deleted,
    payee,
    merchant,
    comment,
    income,
    opIncome,
    outcome,
    opOutcome,
    changed,
    qrCode,
    viewed,
  } = tr
  const trType = getType(tr)

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
        {!viewed && <span className="new"></span>}
        {!!qrCode && <Reciept />}
      </div>
      <div className="content">
        <div className="main-line">
          <span className="tags">
            <span className="main-tag">Перевод</span>
            <span className="main-tag">Перевод</span>
          </span>

          <div className="amounts">
            <span className="secondary-sum">199$</span>
            <span className="primary-sum">199.00 ₽</span>
          </div>
        </div>

        <div className="secondary-line">
          <div className="info">
            {!!payee && <Payee payee={payee} merchant={merchant} />}
            {!!comment && <span className="comment">{comment}</span>}
          </div>

          <div className="accounts">
            <span className="account">Из счёта</span>
            <span className="account">В счёт</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const Reciept: FC = () => (
  <span role="img" aria-label="Чек" className="reciept">
    🧾
  </span>
)
const Payee: FC<{ payee: string | null; merchant: string | null }> = ({
  payee,
  merchant,
  ...rest
}) => {
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
